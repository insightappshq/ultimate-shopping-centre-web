"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { ensureProfile, type SessionUser } from "@/lib/auth/dal";
import { rethrowNextErrors } from "@/lib/errors";
import { toE164India } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthChannel = "email" | "phone";

export type AuthResult =
  | { ok: true; redirectTo?: string; needsVerification?: boolean }
  | { ok: false; error: string; field?: "identifier" | "password" | "token" | "fullName" };

const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");
const tokenSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

/** Only allow same-origin relative redirects. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

type AuthFailure = Extract<AuthResult, { ok: false }>;

function parseIdentifier(channel: AuthChannel, raw: string): { email: string } | { phone: string } | AuthFailure {
  if (channel === "email") {
    const parsed = emailSchema.safeParse(raw);
    return parsed.success
      ? { email: parsed.data }
      : { ok: false, error: parsed.error.issues[0].message, field: "identifier" };
  }
  const phone = toE164India(raw);
  return phone
    ? { phone }
    : { ok: false, error: "Enter a valid 10-digit Indian mobile number", field: "identifier" };
}

function isFailure(value: object): value is AuthFailure {
  return "ok" in value && value.ok === false;
}

function friendlyError(error: AuthError): string {
  const message = error.message.toLowerCase();
  if (error.code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Incorrect credentials. Check and try again.";
  }
  if (error.code === "otp_expired" || message.includes("expired") || message.includes("invalid")) {
    return "That code is invalid or has expired. Request a new one.";
  }
  if (error.code === "over_email_send_rate_limit" || error.code === "over_sms_send_rate_limit" || error.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (error.code === "user_already_exists" || message.includes("already registered")) {
    return "An account already exists. Sign in instead.";
  }
  if (error.code === "email_not_confirmed") return "Verify your email first — we've sent you a code.";
  if (error.code === "phone_not_confirmed") return "Verify your phone number first — we've sent you a code.";
  if (message.includes("sms") || message.includes("phone provider")) {
    return "Phone sign-in isn't available right now. Try email instead.";
  }
  return error.message;
}

async function afterSignIn(user: { id: string; email?: string; phone?: string; user_metadata?: Record<string, unknown> }) {
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  };
  // Profile creation must not block sign-in if the database is briefly unavailable.
  await ensureProfile(sessionUser).catch((error) => console.error("[auth] ensureProfile", error));
}

/** Turns unexpected failures (e.g. misconfiguration, network) into a form error. */
async function guarded(run: () => Promise<AuthResult>): Promise<AuthResult> {
  try {
    return await run();
  } catch (error) {
    rethrowNextErrors(error);
    console.error("[auth]", error);
    return { ok: false, error: "We couldn't reach the sign-in service. Please try again shortly." };
  }
}

export async function sendOtpAction(channel: AuthChannel, identifier: string): Promise<AuthResult> {
  return guarded(async () => {
    const parsed = parseIdentifier(channel, identifier);
    if (isFailure(parsed)) return parsed;

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp(
      "email" in parsed
        ? {
            email: parsed.email,
            options: { shouldCreateUser: true, emailRedirectTo: `${siteConfig.url}/auth/confirm` },
          }
        : { phone: parsed.phone, options: { shouldCreateUser: true } },
    );
    if (error) return { ok: false, error: friendlyError(error), field: "identifier" };
    return { ok: true };
  });
}

export async function verifyOtpAction(
  channel: AuthChannel,
  identifier: string,
  token: string,
  next?: string,
): Promise<AuthResult> {
  return guarded(async () => {
    const parsed = parseIdentifier(channel, identifier);
    if (isFailure(parsed)) return parsed;
    const code = tokenSchema.safeParse(token.trim());
    if (!code.success) return { ok: false, error: code.error.issues[0].message, field: "token" };

    const supabase = await createSupabaseServerClient();
    let result =
      "email" in parsed
        ? await supabase.auth.verifyOtp({ email: parsed.email, token: code.data, type: "email" })
        : await supabase.auth.verifyOtp({ phone: parsed.phone, token: code.data, type: "sms" });

    // Codes sent to confirm a new password sign-up use the "signup" type.
    if (result.error && "email" in parsed) {
      const retry = await supabase.auth.verifyOtp({ email: parsed.email, token: code.data, type: "signup" });
      if (!retry.error) result = retry;
    }

    if (result.error || !result.data.user) {
      return { ok: false, error: result.error ? friendlyError(result.error) : "Verification failed", field: "token" };
    }
    await afterSignIn(result.data.user);
    return { ok: true, redirectTo: safeNext(next) };
  });
}

export async function signInWithPasswordAction(
  channel: AuthChannel,
  identifier: string,
  password: string,
  next?: string,
): Promise<AuthResult> {
  return guarded(async () => {
    const parsed = parseIdentifier(channel, identifier);
    if (isFailure(parsed)) return parsed;
    if (!password) return { ok: false, error: "Enter your password", field: "password" };

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(
      "email" in parsed ? { email: parsed.email, password } : { phone: parsed.phone, password },
    );
    if (error || !data.user) {
      return { ok: false, error: error ? friendlyError(error) : "Sign in failed", field: "password" };
    }
    await afterSignIn(data.user);
    return { ok: true, redirectTo: safeNext(next) };
  });
}

export async function signUpAction(
  channel: AuthChannel,
  identifier: string,
  password: string,
  fullName: string,
  next?: string,
): Promise<AuthResult> {
  return guarded(async () => {
    const parsed = parseIdentifier(channel, identifier);
    if (isFailure(parsed)) return parsed;
    const pwd = passwordSchema.safeParse(password);
    if (!pwd.success) return { ok: false, error: pwd.error.issues[0].message, field: "password" };
    const name = z.string().trim().min(2, "Enter your name").max(80).safeParse(fullName);
    if (!name.success) return { ok: false, error: name.error.issues[0].message, field: "fullName" };

    const supabase = await createSupabaseServerClient();
    const options = {
      data: { full_name: name.data },
      emailRedirectTo: `${siteConfig.url}/auth/confirm`,
    };
    const { data, error } = await supabase.auth.signUp(
      "email" in parsed
        ? { email: parsed.email, password: pwd.data, options }
        : { phone: parsed.phone, password: pwd.data, options: { data: options.data } },
    );
    if (error) return { ok: false, error: friendlyError(error), field: "identifier" };

    // With confirmations enabled Supabase returns a user but no session until verified.
    if (!data.session) return { ok: true, needsVerification: true };
    if (data.user) await afterSignIn(data.user);
    return { ok: true, redirectTo: safeNext(next) };
  });
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
