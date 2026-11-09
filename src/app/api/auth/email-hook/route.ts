import { Webhook } from "standardwebhooks";
import { siteConfig } from "@/config/site";
import { sendEmail } from "@/lib/email/resend";
import { otpEmail, type EmailActionType } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";

/**
 * Supabase Auth "Send Email" hook → Resend.
 *
 * Supabase calls this endpoint instead of its built-in mailer whenever it needs
 * to send an auth email (OTP sign-in, sign-up confirmation, recovery…). We
 * verify the Standard Webhooks signature and deliver a branded email carrying
 * the 6-digit OTP via Resend.
 * Configure in Supabase: Authentication → Hooks → Send Email → HTTPS.
 */

interface SendEmailHookPayload {
  user: { id: string; email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function hookError(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status });
}

function confirmUrl(tokenHash: string, type: EmailActionType, redirectTo: string) {
  const url = new URL("/auth/confirm", siteConfig.url);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type === "login" ? "magiclink" : type);
  try {
    const next = new URL(redirectTo).searchParams.get("next");
    if (next) url.searchParams.set("next", next);
  } catch {
    // redirect_to is optional; ignore malformed values.
  }
  return url.toString();
}

export async function POST(request: Request) {
  const secret = serverEnv().SUPABASE_AUTH_HOOK_SECRET;
  if (!secret) return hookError(500, "Email hook secret is not configured");

  const body = await request.text();
  let payload: SendEmailHookPayload;
  try {
    const webhook = new Webhook(secret.replace(/^v1,whsec_/, ""));
    payload = webhook.verify(body, Object.fromEntries(request.headers)) as SendEmailHookPayload;
  } catch {
    return hookError(401, "Invalid webhook signature");
  }

  const { user, email_data: data } = payload;

  try {
    // Secure email change sends one code to each address.
    const deliveries =
      data.email_action_type === "email_change" && user.new_email && data.token_new
        ? [
            { to: user.email, token: data.token, hash: data.token_hash_new ?? data.token_hash },
            { to: user.new_email, token: data.token_new, hash: data.token_hash },
          ]
        : [{ to: user.email, token: data.token, hash: data.token_hash }];

    await Promise.all(
      deliveries.map(({ to, token, hash }) => {
        const email = otpEmail({
          type: data.email_action_type,
          token,
          confirmUrl: hash ? confirmUrl(hash, data.email_action_type, data.redirect_to) : undefined,
        });
        return sendEmail({ to, ...email, idempotencyKey: `auth-${hash}` });
      }),
    );
  } catch (error) {
    console.error("[email-hook]", error);
    return hookError(502, "Failed to send email");
  }

  return Response.json({});
}
