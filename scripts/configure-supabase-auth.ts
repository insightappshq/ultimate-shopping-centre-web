/**
 * Configures Supabase Auth so email sign-in uses a 6-digit code (no magic
 * link), delivered through Resend.
 *
 *   npm run auth:configure                 Resend SMTP + code-only templates (default)
 *   npm run auth:configure -- --mode=hook --hook-url=https://<domain>/api/auth/email-hook
 *                                          Route auth emails through the app's Send Email hook
 *   npm run auth:configure -- --mode=phone Phone OTP (Twilio Verify) settings: demo test
 *                                          number and a 60s resend interval. Twilio
 *                                          credentials stay as set in the dashboard.
 *   npm run auth:configure -- --dry-run    Print the changes without applying them
 *
 * Requires SUPABASE_ACCESS_TOKEN: a personal access token from
 * https://supabase.com/dashboard/account/tokens (used only by this script).
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import {
  OTP_EXPIRY_MINUTES,
  SUPABASE_TOKEN_PLACEHOLDER,
  otpEmail,
  type EmailActionType,
} from "../src/lib/email/templates";

const API = "https://api.supabase.com/v1";
const OTP_LENGTH = 6; // the app's code input has 6 boxes
const EMAILS_PER_HOUR = 60;

/** Supabase template key → our copy for that email. */
const TEMPLATES: Record<string, EmailActionType> = {
  magic_link: "magiclink", // email OTP sign-in for existing users
  confirmation: "signup", // email OTP sign-in for new users, and password sign-up
  invite: "invite",
  recovery: "recovery",
  email_change: "email_change",
  reauthentication: "reauthentication",
};

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? "true"] as const;
  }),
);
const mode = args.get("mode") ?? "smtp";
const dryRun = args.has("dry-run");

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ref = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!ref) fail("NEXT_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co");
  return ref;
}

/** "USC <no-reply@usc.app>" → { name: "USC", email: "no-reply@usc.app" } */
function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || "USC", email: match[2].trim() };
  return { name: "USC", email: from.trim() };
}

function templateFields() {
  const fields: Record<string, string | number | boolean> = {
    external_email_enabled: true,
    mailer_otp_length: OTP_LENGTH,
    mailer_otp_exp: OTP_EXPIRY_MINUTES * 60,
  };
  for (const [key, type] of Object.entries(TEMPLATES)) {
    const email = otpEmail({ type, code: SUPABASE_TOKEN_PLACEHOLDER });
    fields[`mailer_subjects_${key}`] = email.subject;
    fields[`mailer_templates_${key}_content`] = email.html;
  }
  return fields;
}

function smtpFields() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) fail("RESEND_API_KEY is not set");
  const sender = parseSender(process.env.EMAIL_FROM || "");
  if (!sender.email.includes("@")) fail('EMAIL_FROM must be like "USC <no-reply@your-domain.com>"');
  if (sender.email.endsWith("@resend.dev")) {
    console.warn(
      "⚠ EMAIL_FROM uses resend.dev: Resend will only deliver to your own Resend account email.\n" +
        "  Verify a domain at https://resend.com/domains and use an address on it.\n",
    );
  }
  return {
    // Resend's SMTP relay: https://resend.com/docs/send-with-smtp
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: apiKey,
    smtp_admin_email: sender.email,
    smtp_sender_name: sender.name,
    // Supabase's default (2/hour) is meant for its test mailer; with custom SMTP
    // the project can send more. Per-user requests are still limited to 1/60s.
    rate_limit_email_sent: EMAILS_PER_HOUR,
    hook_send_email_enabled: false,
  };
}

function hookFields() {
  const uri = args.get("hook-url");
  if (!uri?.startsWith("https://")) fail("--hook-url=https://<public-domain>/api/auth/email-hook is required");
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET || `v1,whsec_${randomBytes(32).toString("base64")}`;
  return {
    fields: { hook_send_email_enabled: true, hook_send_email_uri: uri, hook_send_email_secrets: secret },
    generatedSecret: process.env.SUPABASE_AUTH_HOOK_SECRET ? null : secret,
  };
}

async function api(method: "GET" | "PATCH", ref: string, body?: object) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    fail(
      "SUPABASE_ACCESS_TOKEN is not set. Create a personal access token at\n" +
        "  https://supabase.com/dashboard/account/tokens and add it to .env.",
    );
  }
  const response = await fetch(`${API}/projects/${ref}/config/auth`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) fail(`Supabase Management API ${method} failed (${response.status}): ${text.slice(0, 500)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

const redact = (key: string, value: unknown) =>
  /pass|secret/.test(key) ? "••••••" : typeof value === "string" && value.length > 80 ? `<${value.length} chars>` : value;

/**
 * Phone sign-in runs on Twilio Verify (provider and credentials are set in the
 * Supabase dashboard). This adds the demo account's test number — test numbers
 * bypass Twilio, so the demo works without sending a paid SMS — and aligns the
 * resend interval with the app's 60-second "Resend code" timer.
 */
async function phoneFields(ref: string) {
  const phone = (process.env.DEMO_USER_PHONE || process.env.NEXT_PUBLIC_DEMO_PHONE || "+919000000001").replace(/\D/g, "");
  const otp = process.env.DEMO_USER_PHONE_OTP || process.env.NEXT_PUBLIC_DEMO_PHONE_OTP || "123456";
  if (!/^\d{4,10}$/.test(otp)) fail("DEMO_USER_PHONE_OTP must be 4–10 digits");

  // Keep any test numbers already configured in the dashboard.
  const current = await api("GET", ref);
  const entries = new Map(
    String(current.sms_test_otp ?? "")
      .split(",")
      .filter(Boolean)
      .map((pair) => pair.split("=") as [string, string]),
  );
  entries.set(phone, otp);

  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  return {
    sms_test_otp: [...entries].map(([number, code]) => `${number}=${code}`).join(","),
    sms_test_otp_valid_until: validUntil,
    sms_max_frequency: 60,
  };
}

async function main() {
  if (!["smtp", "hook", "phone"].includes(mode)) fail('--mode must be "smtp", "hook" or "phone"');
  const ref = projectRef();

  if (mode === "phone") {
    const changes = await phoneFields(ref);
    console.log(`\nSupabase project ${ref} — phone OTP via Twilio Verify`);
    for (const [key, value] of Object.entries(changes)) console.log(`  ${key}: ${value}`);
    if (dryRun) {
      console.log("\nDry run — nothing was changed.\n");
      return;
    }
    const updated = await api("PATCH", ref, changes);
    if (updated.sms_provider !== "twilio_verify") {
      console.warn(`\n⚠ SMS provider is "${updated.sms_provider}", not Twilio Verify. Check Authentication → Sign In / Providers → Phone.`);
    }
    console.log("\n✓ Phone OTP settings applied. Allow ~1 minute for Supabase to restart its auth server.\n");
    return;
  }

  const hook = mode === "hook" ? hookFields() : null;
  const changes = { ...templateFields(), ...(hook ? hook.fields : smtpFields()) };

  console.log(`\nSupabase project ${ref} — email OTP via Resend (${mode} mode)`);
  for (const [key, value] of Object.entries(changes)) console.log(`  ${key}: ${redact(key, value)}`);

  if (dryRun) {
    console.log("\nDry run — nothing was changed.\n");
    return;
  }

  await api("GET", ref); // fail fast on a bad token or ref before changing anything
  const updated = await api("PATCH", ref, changes);

  const mismatched = Object.keys(changes).filter(
    (key) => !/pass|secret/.test(key) && key in updated && updated[key] !== changes[key as keyof typeof changes],
  );
  if (mismatched.length) fail(`Supabase did not apply: ${mismatched.join(", ")}`);

  console.log("\n✓ Email sign-in now sends a 6-digit code (no link).");
  console.log("  Supabase restarts its auth server to apply this; allow ~1 minute before testing.");
  if (hook?.generatedSecret) {
    console.log(`\nAdd this to .env, then restart the app:\n  SUPABASE_AUTH_HOOK_SECRET=${hook.generatedSecret}\n`);
  } else {
    console.log("  Emails are delivered by Resend SMTP using the branded templates.\n");
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
