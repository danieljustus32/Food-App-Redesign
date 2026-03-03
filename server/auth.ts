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
import type { User } from "@shared/schema";

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
      secret: process.env.SESSION_SECRET || "tindish-secret-key-change-me",
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
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
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

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          callbackURL: `${baseUrl}/api/auth/apple/callback`,
          scope: ["name", "email"],
        },
        async (_accessToken: string, _refreshToken: string, idToken: any, profile: any, done: any) => {
          try {
            const email = idToken?.email || profile?.email;
            const appleId = idToken?.sub || profile?.id;
            if (!email || !appleId) {
              return done(new Error("No email or ID found in Apple profile"));
            }
            const user = await findOrCreateSocialUser("apple", appleId, email);
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
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

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.status(201).json({ id: user.id, username: user.username });
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
        return res.json({ id: user.id, username: user.username });
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
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
      return res.status(501).json({ message: "Apple authentication is not configured. Please add APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY." });
    }
    passport.authenticate("apple")(req, res, next);
  });

  app.post("/api/auth/apple/callback", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("apple", { failureRedirect: "/auth?error=apple_failed" })(req, res, () => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><meta http-equiv="refresh" content="0;url=/"></head>
          <body></body>
        </html>
      `);
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      return res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as User;
    return res.json({ id: user.id, username: user.username });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}
