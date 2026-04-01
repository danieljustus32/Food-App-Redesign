import Mailgun from "mailgun.js";
import FormData from "form-data";
import { randomBytes } from "crypto";

const mailgun = new Mailgun(FormData);

function getClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    throw new Error("MAILGUN_API_KEY is not configured");
  }
  console.log("[MAILGUN] Creating client with API key length:", apiKey.length, "starts with:", apiKey.substring(0, 6));
  return mailgun.client({ username: "api", key: apiKey });
}

function getDomain(): string {
  const domain = process.env.MAILGUN_DOMAIN;
  if (!domain) {
    throw new Error("MAILGUN_DOMAIN is not configured");
  }
  return domain;
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function getAppBaseUrl(): string {
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const primaryDomain = replitDomains.split(",")[0].trim();
    const url = `https://${primaryDomain}`;
    console.log("[EMAIL] Resolved app base URL from REPLIT_DOMAINS:", url);
    return url;
  }
  const port = process.env.PORT || 5000;
  const url = `http://localhost:${port}`;
  console.log("[EMAIL] Resolved app base URL (local fallback):", url);
  return url;
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const domain = getDomain();
  const client = getClient();

  const baseUrl = getAppBaseUrl();
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  console.log("[EMAIL] Building verification email:", {
    to,
    baseUrl,
    verifyUrl,
    tokenLength: token.length,
    tokenPreview: token.substring(0, 8) + "...",
  });

  const messageData = {
    from: `Feastly <noreply@${domain}>`,
    to: [to],
    subject: "Verify your Feastly account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #f0ebe7;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 0 0 4px;">Feastly</h1>
          <p style="color: #8a6e5e; font-size: 14px; margin: 0;">Swipe. Save. Cook.</p>
        </div>
        <div style="background: #faf7f5; border-radius: 16px; padding: 32px; border: 1px solid #ddd3cc;">
          <h2 style="font-size: 20px; color: #1a1a1a; margin: 0 0 12px;">Verify your email</h2>
          <p style="color: #5a4a42; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Thanks for signing up! Please click the button below to verify your email address and activate your account.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #b22222; color: #fff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 9999px; text-decoration: none;">
              Verify Email
            </a>
          </div>
          <p style="color: #a08878; font-size: 12px; line-height: 1.5; margin: 0;">
            If you didn't create an account, you can safely ignore this email.
            This link will expire eventually, but you can always request a new one.
          </p>
        </div>
      </div>
    `,
  };

  console.log("[MAILGUN] Sending email with config:", {
    domain,
    from: messageData.from,
    to: messageData.to,
    subject: messageData.subject,
    verifyUrl,
  });

  try {
    const response = await client.messages.create(domain, messageData);
    console.log("[MAILGUN] Send response:", JSON.stringify(response, null, 2));
    console.log("[EMAIL] Verification email sent successfully to:", to);
  } catch (err: any) {
    console.error("[MAILGUN] Send error:", {
      message: err.message,
      status: err.status,
      details: err.details,
      type: err.type,
    });
    if (err.response) {
      console.error("[MAILGUN] Error response body:", JSON.stringify(err.response, null, 2));
    }
    throw err;
  }
}
