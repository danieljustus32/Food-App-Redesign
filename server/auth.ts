import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import AppleStrategy from "passport-apple";
import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";
import { generateVerificationToken, sendVerificationEmail } from "./email";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored || stored === "") return false;
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare global {
  namespace Express {
    interface User extends import("@shared/schema").User {}
  }
}

async function findOrCreateSocialUser(provider: string, providerId: string, email: string): Promise<User> {
  let user = await storage.getUserByProvider(provider, providerId);
  if (user) return user;

  const existingByEmail = await storage.getUserByUsername(email);
  if (existingByEmail) {
    return existingByEmail;
  }

  user = await storage.createUser({
    username: email,
    password: "",
    authProvider: provider,
    authProviderId: providerId,
  });
  await storage.markEmailVerified(user.id);
  return user;
}

export function setupAuth(app: Express) {
  const PgStore = connectPgSimple(session);

  if (process.env.REPLIT_DOMAINS) {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "feastly-secret-key-change-me",
      resave: true,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        maxAge: 45 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: !!process.env.REPLIT_DOMAINS,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Email not found" });
        }
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0] || `localhost:${process.env.PORT || 5000}`;
  const protocol = process.env.REPLIT_DOMAINS ? "https" : "http";
  const baseUrl = `${protocol}://${replitDomain}`;

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${baseUrl}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }
            const user = await findOrCreateSocialUser("google", profile.id, email);
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  console.log("[APPLE_AUTH] Config check:", {
    hasClientID: !!process.env.APPLE_CLIENT_ID,
    hasTeamID: !!process.env.APPLE_TEAM_ID,
    hasKeyID: !!process.env.APPLE_KEY_ID,
    hasPrivateKey: !!process.env.APPLE_PRIVATE_KEY,
    callbackURL: `${baseUrl}/api/auth/apple/callback`,
    baseUrl,
    replitDomains: process.env.REPLIT_DOMAINS,
  });

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    console.log("[APPLE_AUTH] Registering Apple strategy");

    let applePrivateKey = process.env.APPLE_PRIVATE_KEY;
    applePrivateKey = applePrivateKey.replace(/\\n/g, "\n");
    if (!applePrivateKey.includes("\n") && applePrivateKey.includes("-----")) {
      applePrivateKey = applePrivateKey
        .replace(/-----BEGIN PRIVATE KEY-----\s*/, "-----BEGIN PRIVATE KEY-----\n")
        .replace(/\s*-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----");
      const parts = applePrivateKey.split("\n");
      if (parts.length === 3) {
        const body = parts[1];
        const bodyLines = body.match(/.{1,64}/g) || [];
        applePrivateKey = parts[0] + "\n" + bodyLines.join("\n") + "\n" + parts[2];
      }
    }

    console.log("[APPLE_AUTH] Private key starts with:", applePrivateKey.substring(0, 40));
    console.log("[APPLE_AUTH] Private key ends with:", applePrivateKey.substring(applePrivateKey.length - 40));
    console.log("[APPLE_AUTH] Private key contains newlines:", applePrivateKey.includes("\n"));
    console.log("[APPLE_AUTH] Private key line count:", applePrivateKey.split("\n").length);

    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: applePrivateKey,
          callbackURL: `${baseUrl}/api/auth/apple/callback`,
          scope: ["name", "email"],
          passReqToCallback: false,
        },
        async (_accessToken: string, _refreshToken: string, idToken: any, profile: any, done: any) => {
          try {
            console.log("[APPLE_AUTH] Verify callback invoked");
            console.log("[APPLE_AUTH] idToken type:", typeof idToken);
            console.log("[APPLE_AUTH] profile:", JSON.stringify(profile));

            let decoded: any = idToken;
            if (typeof idToken === "string") {
              console.log("[APPLE_AUTH] idToken is a raw JWT string, decoding...");
              decoded = jwt.decode(idToken);
              console.log("[APPLE_AUTH] Decoded idToken:", JSON.stringify(decoded));
            } else {
              console.log("[APPLE_AUTH] idToken is already decoded");
              console.log("[APPLE_AUTH] idToken keys:", idToken ? Object.keys(idToken) : "null");
            }

            const email = decoded?.email || profile?.email;
            const appleId = decoded?.sub || profile?.id;
            console.log("[APPLE_AUTH] Resolved email:", email, "appleId:", appleId);
            if (!email || !appleId) {
              console.error("[APPLE_AUTH] Missing email or appleId, failing");
              return done(new Error("No email or ID found in Apple profile"));
            }
            const user = await findOrCreateSocialUser("apple", appleId, email);
            console.log("[APPLE_AUTH] User found/created:", { id: user.id, username: user.username });
            return done(null, user);
          } catch (err) {
            console.error("[APPLE_AUTH] Verify callback error:", err);
            return done(err as Error);
          }
        }
      )
    );
  } else {
    console.log("[APPLE_AUTH] Apple strategy NOT registered - missing env vars");
  }

  passport.serializeUser((user: User, done) => {
    console.log("[AUTH] serializeUser called, user.id:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log("[AUTH] deserializeUser called, id:", id);
      const user = await storage.getUser(id);
      console.log("[AUTH] deserializeUser result:", user ? { id: user.id, username: user.username } : "null");
      done(null, user || false);
    } catch (err) {
      console.error("[AUTH] deserializeUser error:", err);
      done(err);
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });

      const token = generateVerificationToken();
      await storage.setEmailVerificationToken(user.id, token);

      try {
        await sendVerificationEmail(username, token);
        console.log("[AUTH] Verification email sent to", username);
      } catch (emailErr) {
        console.error("[AUTH] Failed to send verification email:", emailErr);
      }

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.status(201).json({ id: user.id, username: user.username, emailVerified: user.emailVerified });
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, username: user.username, emailVerified: user.emailVerified });
      });
    })(req, res, next);
  });

  app.get("/api/auth/google", (req: Request, res: Response, next: NextFunction) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(501).json({ message: "Google authentication is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", { failureRedirect: "/auth?error=google_failed" })(req, res, () => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/apple", (req: Request, res: Response, next: NextFunction) => {
    console.log("[APPLE_AUTH] /api/auth/apple hit - initiating Apple auth");
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
      console.error("[APPLE_AUTH] Missing env vars, returning 501");
      return res.status(501).json({ message: "Apple authentication is not configured. Please add APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY." });
    }
    passport.authenticate("apple")(req, res, next);
  });

  app.post("/api/auth/apple/callback", (req: Request, res: Response, next: NextFunction) => {
    console.log("[APPLE_AUTH] /api/auth/apple/callback POST received");
    console.log("[APPLE_AUTH] Request body keys:", req.body ? Object.keys(req.body) : "no body");
    console.log("[APPLE_AUTH] Has session cookie:", !!req.headers.cookie);
    console.log("[APPLE_AUTH] Session ID before auth:", req.sessionID);
    console.log("[APPLE_AUTH] req.isAuthenticated() before auth:", req.isAuthenticated());

    passport.authenticate("apple", (err: any, user: any, info: any) => {
      if (err) {
        console.error("[APPLE_AUTH] passport.authenticate error:", err);
        return res.redirect("/auth?error=apple_failed");
      }
      if (!user) {
        console.error("[APPLE_AUTH] passport.authenticate returned no user, info:", info);
        return res.redirect("/auth?error=apple_failed");
      }

      console.log("[APPLE_AUTH] passport.authenticate success, user:", { id: user.id, username: user.username });

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[APPLE_AUTH] req.login error:", loginErr);
          return res.redirect("/auth?error=apple_failed");
        }

        console.log("[APPLE_AUTH] req.login success");
        console.log("[APPLE_AUTH] Session ID after login:", req.sessionID);
        console.log("[APPLE_AUTH] req.isAuthenticated() after login:", req.isAuthenticated());
        console.log("[APPLE_AUTH] req.session.passport:", JSON.stringify((req.session as any)?.passport));

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[APPLE_AUTH] session.save error:", saveErr);
          } else {
            console.log("[APPLE_AUTH] session.save success");
          }

          const setCookieHeader = res.getHeaders()["set-cookie"];
          console.log("[APPLE_AUTH] Set-Cookie header present:", !!setCookieHeader);

          res.send(`
            <!DOCTYPE html>
            <html>
              <head><meta http-equiv="refresh" content="0;url=/"></head>
              <body></body>
            </html>
          `);
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      return res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    console.log("[AUTH] /api/auth/me hit");
    console.log("[AUTH] Session ID:", req.sessionID);
    console.log("[AUTH] Has cookie:", !!req.headers.cookie);
    console.log("[AUTH] isAuthenticated:", req.isAuthenticated());
    console.log("[AUTH] session.passport:", JSON.stringify((req.session as any)?.passport));
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as User;
    return res.json({ id: user.id, username: user.username, emailVerified: user.emailVerified });
  });

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).send(verificationResultPage("Invalid Link", "The verification link is invalid or missing a token.", false));
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.send(verificationResultPage("Link Expired or Invalid", "This verification link has already been used or is invalid. Please request a new one from the app.", false));
      }

      await storage.markEmailVerified(user.id);
      return res.send(verificationResultPage("Email Verified!", "Your email has been verified successfully. You can now return to the app and enjoy all features.", true));
    } catch (err: any) {
      console.error("[AUTH] Email verification error:", err);
      return res.status(500).send(verificationResultPage("Something Went Wrong", "We couldn't verify your email right now. Please try again later.", false));
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as User;

    if (user.emailVerified) {
      return res.json({ message: "Email is already verified" });
    }

    if (user.authProvider) {
      return res.json({ message: "Social login accounts do not need email verification" });
    }

    const token = generateVerificationToken();
    await storage.setEmailVerificationToken(user.id, token);

    try {
      await sendVerificationEmail(user.username, token);
      return res.json({ message: "Verification email sent" });
    } catch (err: any) {
      console.error("[AUTH] Failed to resend verification email:", err);
      return res.status(500).json({ message: "Failed to send verification email. Please try again later." });
    }
  });
}

function verificationResultPage(title: string, message: string, success: boolean): string {
  const color = success ? "#22c55e" : "#ef4444";
  const icon = success
    ? `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Feastly</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;max-width:400px;padding:40px 24px;">
    <div style="margin-bottom:24px;">${icon}</div>
    <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">${title}</h1>
    <p style="font-size:15px;color:#666;line-height:1.6;margin:0 0 32px;">${message}</p>
    <a href="/" style="display:inline-block;background:#f97316;color:#fff;font-weight:600;font-size:15px;padding:12px 32px;border-radius:9999px;text-decoration:none;">Open Feastly</a>
  </div>
</body>
</html>`;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}
