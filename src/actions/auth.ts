"use server";

import type { AuthError, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authConfig, otpLengthFor, type OtpDelivery } from "@/config/auth";
import { siteConfig } from "@/config/site";
import { findAccount } from "@/lib/auth/accounts";
import { ensureProfile, type SessionUser } from "@/lib/auth/dal";
import { rethrowNextErrors } from "@/lib/errors";
import { toE164India } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthChannel = "email" | "phone";

export type AuthResult =
  | {
      ok: true;
      redirectTo?: string;
      /** A code was sent; show the code screen. */
      needsVerification?: boolean;
      /** Explains why a code was sent (e.g. "You already have an account"). */
      notice?: string;
    }
  | {
      ok: false;
      error: string;
      field?: "identifier" | "password" | "token" | "fullName";
      /** no_account → continue with sign-up; wrong_password → offer a one-time code. */
      code?: "no_account" | "wrong_password";
    };

const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");
function tokenSchema(channel: AuthChannel) {
  const length = otpLengthFor(channel);
  return z.string().regex(new RegExp(`^\\d{${length}}$`), `Enter the ${length}-digit code`);
}

/** Only allow same-origin relative redirects. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
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
  return smsProviderError(message) ?? error.message;
}

/**
 * Twilio Verify errors arrive wrapped in Supabase's message (for example
 * "Error sending confirmation OTP to provider: … 60203"). Map the common ones
 * to guidance the shopper can act on.
 */
function smsProviderError(message: string): string | null {
  if (!/provider|twilio|verify|sms|whatsapp/.test(message)) return null;
  if (/60203|max send attempts/.test(message)) {
    return "Too many codes were requested for this number. Please wait 10 minutes and try again.";
  }
  if (/60202|max check attempts/.test(message)) {
    return "Too many incorrect codes. Request a new code and try again.";
  }
  if (/60200|21211|21614|invalid parameter.*to|not a valid phone|invalid phone/.test(message)) {
    return "That mobile number can't receive codes. Check the number and try again.";
  }
  if (/60605|21408|geo|region|permission to send/.test(message)) {
    return "We can't send codes to this number's region yet. Try signing in with email.";
  }
  if (/whatsapp|60410|channel/.test(message)) {
    return "WhatsApp codes aren't available right now. Send the code by SMS instead.";
  }
  if (/20404|not found/.test(message)) {
    return "That code is invalid or has expired. Request a new one.";
  }
  return "We couldn't send a code to this number right now. Try again shortly, or sign in with email.";
}

/**
 * Ensures the profile row exists and decides where to go next: first-time
 * shoppers complete their profile (and confirm their pincode) before the app.
 */
async function afterSignIn(user: User, next: string | undefined): Promise<string> {
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  };
  // Profile creation must not block sign-in if the database is briefly unavailable.
  await ensureProfile(sessionUser).catch((error) => console.error("[auth] ensureProfile", error));

  // The app needs a profile *and* both identifiers verified (see onboarding).
  const destination = safeNext(next);
  const complete =
    Boolean(user.user_metadata?.onboarded) &&
    Boolean(user.email && user.email_confirmed_at) &&
    Boolean(user.phone && user.phone_confirmed_at);
  return complete ? destination : `/onboarding?next=${encodeURIComponent(destination)}`;
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

export async function sendOtpAction(
  channel: AuthChannel,
  identifier: string,
  delivery: OtpDelivery = "sms",
): Promise<AuthResult> {
  return guarded(async () => {
    const parsed = parseIdentifier(channel, identifier);
    if (isFailure(parsed)) return parsed;

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp(
      // Email: Supabase sends a code-only email (see `npm run auth:configure`).
      // Phone: Supabase asks Twilio Verify to send the code by SMS or WhatsApp.
      "email" in parsed
        ? { email: parsed.email, options: { shouldCreateUser: true } }
        : {
            phone: parsed.phone,
            options: {
              shouldCreateUser: true,
              channel: delivery === "whatsapp" && authConfig.whatsappOtp ? "whatsapp" : "sms",
            },
          },
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
    const code = tokenSchema(channel).safeParse(token.trim());
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
    return { ok: true, redirectTo: await afterSignIn(result.data.user, next) };
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
    if (!error && data.user) return { ok: true, redirectTo: await afterSignIn(data.user, next) };

    // Signed up earlier but never verified: send a fresh code and finish verifying.
    if (error?.code === "email_not_confirmed" || error?.code === "phone_not_confirmed") {
      const resent = await supabase.auth.resend(
        "email" in parsed ? { type: "signup", email: parsed.email } : { type: "sms", phone: parsed.phone },
      );
      if (resent.error) return { ok: false, error: friendlyError(resent.error), field: "password" };
      return {
        ok: true,
        needsVerification: true,
        notice: `Your account isn't verified yet. Enter the code we just sent to finish signing in.`,
      };
    }

    // Same error for "no account" and "wrong password" — tell them apart.
    if (error?.code === "invalid_credentials" || /invalid login credentials/i.test(error?.message ?? "")) {
      const account = await findAccount(parsed);
      if (!account) {
        return {
          ok: false,
          code: "no_account",
          field: "identifier",
          error: `There's no USC account for this ${"email" in parsed ? "email" : "mobile number"} yet.`,
        };
      }
      return {
        ok: false,
        code: "wrong_password",
        field: "password",
        error: account.hasPassword
          ? "That password isn't right. Try again, or sign in with a one-time code."
          : "This account doesn't have a password yet. Sign in with a one-time code, or use Forgot password to set one.",
      };
    }
    return { ok: false, error: error ? friendlyError(error) : "Sign in failed", field: "password" };
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

    // Already registered and verified? Supabase would "succeed" silently without
    // sending anything. Instead, prove it's them with a code and sign them in;
    // onboarding then asks for whichever identifier is still missing.
    const signInExisting = async (): Promise<AuthResult> => {
      const sent = await supabase.auth.signInWithOtp(
        "email" in parsed
          ? { email: parsed.email, options: { shouldCreateUser: false } }
          : { phone: parsed.phone, options: { shouldCreateUser: false, channel: "sms" } },
      );
      if (sent.error) return { ok: false, error: friendlyError(sent.error), field: "identifier" };
      return {
        ok: true,
        needsVerification: true,
        notice: `You already have a USC account with this ${"email" in parsed ? "email" : "mobile number"}. Enter the code we sent to sign in.`,
      };
    };
    const existing = await findAccount(parsed);
    if (existing?.confirmed) return signInExisting();

    const options = {
      data: { full_name: name.data },
      emailRedirectTo: `${siteConfig.url}/auth/confirm`,
    };
    const { data, error } = await supabase.auth.signUp(
      "email" in parsed
        ? { email: parsed.email, password: pwd.data, options }
        : { phone: parsed.phone, password: pwd.data, options: { data: options.data } },
    );
    if (error) {
      if (error.code === "user_already_exists" || /already registered/i.test(error.message)) return signInExisting();
      return { ok: false, error: friendlyError(error), field: "identifier" };
    }
    // An empty identities list is Supabase's signal that the account already exists.
    if (data.user && data.user.identities?.length === 0) return signInExisting();

    // With confirmations enabled Supabase returns a user but no session until verified.
    if (!data.session) return { ok: true, needsVerification: true };
    return { ok: true, redirectTo: data.user ? await afterSignIn(data.user, next) : safeNext(next) };
  });
}

/**
 * Forgot / set password, step 1: send a one-time code to an existing account.
 * Works for accounts created with a code that never had a password. Step 2 is
 * `verifyOtpAction` (which signs them in); step 3 is `setPasswordAction`.
 */
export async function sendPasswordResetCodeAction(
  channel: AuthChannel,
  identifier: string,
  delivery: OtpDelivery = "sms",
): Promise<AuthResult> {
  return guarded(async () => {
    const parsed = parseIdentifier(channel, identifier);
    if (isFailure(parsed)) return parsed;

    const account = await findAccount(parsed);
    if (!account) {
      return {
        ok: false,
        code: "no_account",
        field: "identifier",
        error: `There's no USC account for this ${"email" in parsed ? "email" : "mobile number"}.`,
      };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp(
      "email" in parsed
        ? { email: parsed.email, options: { shouldCreateUser: false } }
        : {
            phone: parsed.phone,
            options: {
              shouldCreateUser: false,
              channel: delivery === "whatsapp" && authConfig.whatsappOtp ? "whatsapp" : "sms",
            },
          },
    );
    if (error) return { ok: false, error: friendlyError(error), field: "identifier" };
    return { ok: true, needsVerification: true };
  });
}

/** Forgot / set password, step 3: set a new password for the signed-in user. */
export async function setPasswordAction(password: string, confirm: string, next?: string): Promise<AuthResult> {
  return guarded(async () => {
    const pwd = passwordSchema.safeParse(password);
    if (!pwd.success) return { ok: false, error: pwd.error.issues[0].message, field: "password" };
    if (password !== confirm) return { ok: false, error: "The passwords don't match.", field: "password" };

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase.auth.getUser();
    if (!current.user) {
      return { ok: false, error: "Your session has expired. Request a new code to continue.", field: "token" };
    }

    const { data, error } = await supabase.auth.updateUser({ password: pwd.data });
    if (error) {
      if (error.code === "same_password") {
        return { ok: false, error: "That's your current password. Choose a different one.", field: "password" };
      }
      if (error.code === "weak_password") {
        return { ok: false, error: "Choose a stronger password with letters and numbers.", field: "password" };
      }
      return { ok: false, error: friendlyError(error), field: "password" };
    }
    return { ok: true, redirectTo: await afterSignIn(data.user ?? current.user, next) };
  });
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
