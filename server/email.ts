import Mailgun from "mailgun.js";
import FormData from "form-data";
import { randomBytes } from "crypto";

const mailgun = new Mailgun(FormData);

function getClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    throw new Error("MAILGUN_API_KEY is not configured");
  }
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

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const domain = getDomain();
  const client = getClient();

  const replitDomain =
    process.env.REPLIT_DOMAINS?.split(",")[0] ||
    `localhost:${process.env.PORT || 5000}`;
  const protocol = process.env.REPLIT_DOMAINS ? "https" : "http";
  const baseUrl = `${protocol}://${replitDomain}`;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await client.messages.create(domain, {
    from: `Tindish <noreply@${domain}>`,
    to: [to],
    subject: "Verify your Tindish account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 0;">Tindish</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">Swipe. Save. Cook.</p>
        </div>
        <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #e5e5e5;">
          <h2 style="font-size: 20px; color: #1a1a1a; margin: 0 0 12px;">Verify your email</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Thanks for signing up! Please click the button below to verify your email address and activate your account.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #f97316; color: #fff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 9999px; text-decoration: none;">
              Verify Email
            </a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">
            If you didn't create an account, you can safely ignore this email.
            This link will expire eventually, but you can always request a new one.
          </p>
        </div>
      </div>
    `,
  });
}
