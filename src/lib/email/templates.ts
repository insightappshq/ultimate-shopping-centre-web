import { siteConfig } from "@/config/site";

export type EmailActionType =
  | "signup"
  | "login"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change"
  | "email"
  | "reauthentication";

const COPY: Record<string, { subject: string; heading: string; intro: string }> = {
  signup: {
    subject: "Confirm your USC account",
    heading: "Welcome to USC",
    intro: "Use this code to verify your email and finish creating your account.",
  },
  recovery: {
    subject: "Reset your USC password",
    heading: "Reset your password",
    intro: "Use this code to reset your password.",
  },
  email_change: {
    subject: "Confirm your new email",
    heading: "Confirm your new email",
    intro: "Use this code to confirm the change to your email address.",
  },
  invite: {
    subject: "You're invited to USC",
    heading: "You're invited",
    intro: "Use this code to accept your invitation.",
  },
  reauthentication: {
    subject: "Confirm it's you",
    heading: "Confirm it's you",
    intro: "Use this code to confirm this sensitive action.",
  },
  default: {
    subject: "Your USC sign-in code",
    heading: "Your sign-in code",
    intro: "Use this code to sign in to Ultimate Shopping Centre.",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function otpEmail({
  type,
  token,
  confirmUrl,
}: {
  type: EmailActionType;
  token: string;
  confirmUrl?: string;
}) {
  const copy = COPY[type] ?? COPY.default;
  const code = escapeHtml(token);
  const link = confirmUrl ? escapeHtml(confirmUrl) : null;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141833;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e4e7f2;overflow:hidden;">
          <tr><td style="background:#2b3bc9;padding:20px 28px;">
            <span style="display:inline-block;background:#ffffff;color:#2b3bc9;font-weight:800;border-radius:8px;padding:4px 8px;font-size:14px;letter-spacing:0.5px;">USC</span>
            <span style="color:#ffffff;font-weight:600;font-size:15px;margin-left:8px;">${siteConfig.name}</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 8px;font-size:22px;">${copy.heading}</h1>
            <p style="margin:0 0 24px;color:#5a6080;font-size:15px;line-height:22px;">${copy.intro}</p>
            <div style="text-align:center;background:#f4f5fb;border-radius:12px;padding:18px;font-size:32px;font-weight:700;letter-spacing:10px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${code}</div>
            <p style="margin:16px 0 0;color:#5a6080;font-size:13px;">This code expires in 10 minutes. Never share it with anyone — USC will never ask for it.</p>
            ${
              link
                ? `<p style="margin:24px 0 0;font-size:13px;color:#5a6080;">Or <a href="${link}" style="color:#2b3bc9;font-weight:600;">continue with one click</a>.</p>`
                : ""
            }
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid #e4e7f2;color:#8a8fa8;font-size:12px;">
            If you didn't request this, you can safely ignore this email.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${copy.heading}\n\n${copy.intro}\n\nYour code: ${token}\n\n${
    confirmUrl ? `Or open: ${confirmUrl}\n\n` : ""
  }This code expires in 10 minutes. If you didn't request it, ignore this email.`;

  return { subject: copy.subject, html, text };
}
