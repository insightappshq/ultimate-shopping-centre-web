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

/** Supabase's template placeholder for the one-time code (SMTP mode). */
export const SUPABASE_TOKEN_PLACEHOLDER = "{{ .Token }}";

export const OTP_EXPIRY_MINUTES = 10;

const COPY: Record<string, { subject: string; heading: string; intro: string }> = {
  signup: {
    subject: "Your USC verification code",
    heading: "Verify your email",
    intro: "Enter this code in the USC app to verify your email and finish creating your account.",
  },
  recovery: {
    subject: "Your USC password reset code",
    heading: "Reset your password",
    intro: "Enter this code in the USC app to reset your password.",
  },
  email_change: {
    subject: "Confirm your new email for USC",
    heading: "Confirm your new email",
    intro: "Enter this code in the USC app to confirm your new email address.",
  },
  invite: {
    subject: "Your USC invitation code",
    heading: "You're invited to USC",
    intro: "Enter this code in the USC app to accept your invitation.",
  },
  reauthentication: {
    subject: "Your USC confirmation code",
    heading: "Confirm it's you",
    intro: "Enter this code in the USC app to confirm this action.",
  },
  default: {
    subject: "Your USC sign-in code",
    heading: "Your sign-in code",
    intro: "Enter this code in the USC app to sign in.",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Branded, code-only auth email. Deliberately contains no sign-in link: the
 * shopper must type the code into the app, which keeps sign-in on the device
 * that requested it.
 *
 * `code` is either a real code (Send Email hook) or Supabase's
 * `{{ .Token }}` placeholder (Supabase-managed templates over Resend SMTP).
 */
export function otpEmail({
  type,
  code,
  expiresInMinutes = OTP_EXPIRY_MINUTES,
}: {
  type: EmailActionType;
  code: string;
  expiresInMinutes?: number;
}) {
  const copy = COPY[type] ?? COPY.default;
  const safeCode = escapeHtml(code);

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
            <div style="text-align:center;background:#f4f5fb;border-radius:12px;padding:18px;font-size:32px;font-weight:700;letter-spacing:10px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${safeCode}</div>
            <p style="margin:16px 0 0;color:#5a6080;font-size:13px;line-height:20px;">This code expires in ${expiresInMinutes} minutes. Never share it with anyone — USC will never ask you for it.</p>
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid #e4e7f2;color:#8a8fa8;font-size:12px;">
            If you didn't request this code, you can safely ignore this email.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${copy.heading}\n\n${copy.intro}\n\nYour code: ${code}\n\nThis code expires in ${expiresInMinutes} minutes. If you didn't request it, ignore this email.`;

  return { subject: copy.subject, html, text };
}
