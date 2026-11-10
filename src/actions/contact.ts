"use server";

import type { AuthError, User } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { z } from "zod";
import { otpLengthFor } from "@/config/auth";
import { contactStatusOf, getContactStatus } from "@/lib/auth/contact";
import type { ContactKind } from "@/lib/auth/contact-types";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import { mergeAccountData } from "@/lib/data/merge";
import { rethrowNextErrors } from "@/lib/errors";
import { formatPhone, toE164India } from "@/lib/format";
import { isAdminConfigured, supabaseAdmin, supabaseEphemeral } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Linking a second sign-in identifier (email ↔ phone) to the current account.
 *
 *  1. startVerification  → Supabase sends a code to the new email/phone
 *                          (updateUser; email via Resend, phone via Twilio Verify).
 *  2. confirmVerification → verifyOtp(email_change | phone_change) attaches it.
 *
 * If the identifier already belongs to another account (email_exists /
 * phone_exists), the shopper can prove they own that account and merge:
 *
 *  3. startMerge    → a code is sent to the *other* account (cookie-less client,
 *                     so the current session is untouched).
 *  4. completeMerge → verify it, move cart/wishlist/history onto the other
 *                     (older) account, delete the duplicate, attach this
 *                     identifier there, and switch the session to it.
 */

export type ContactResult =
  | { ok: true; redirectTo?: string; notice?: string }
  | { ok: false; error: string; code?: "exists" | "invalid" | "unavailable"; canMerge?: boolean };

const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();

function parse(kind: ContactKind, raw: string): string | ContactResult {
  if (kind === "email") {
    const parsed = emailSchema.safeParse(raw);
    return parsed.success ? parsed.data : { ok: false, error: parsed.error.issues[0].message, code: "invalid" };
  }
  return toE164India(raw) ?? { ok: false, error: "Enter a valid 10-digit Indian mobile number", code: "invalid" };
}

function codeSchema(kind: ContactKind) {
  const length = otpLengthFor(kind);
  return z.string().regex(new RegExp(`^\\d{${length}}$`), `Enter the ${length}-digit code`);
}

function isTaken(error: AuthError): boolean {
  return (
    error.code === "email_exists" ||
    error.code === "phone_exists" ||
    /already (been )?registered|already in use|already exists/i.test(error.message)
  );
}

function describe(error: AuthError): string {
  if (error.code === "otp_expired" || /expired|invalid/i.test(error.message)) {
    return "That code is invalid or has expired. Request a new one.";
  }
  if (error.status === 429 || /rate limit/i.test(error.message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (/sms|provider|twilio/i.test(error.message)) {
    return "We couldn't send a code to this number right now. Try again shortly.";
  }
  return error.message;
}

async function guard(run: () => Promise<ContactResult>): Promise<ContactResult> {
  try {
    return await run();
  } catch (error) {
    rethrowNextErrors(error);
    console.error("[contact]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Sends a code to the email/phone being added to this account. */
export async function startVerificationAction(kind: ContactKind, raw: string): Promise<ContactResult> {
  return guard(async () => {
    await requireUserForMutation();
    const value = parse(kind, raw);
    if (typeof value !== "string") return value;

    const status = await getContactStatus();
    if (!status) return { ok: false, error: "Your session has expired. Sign in again." };
    if (kind === "email" ? status.emailVerified : status.phoneVerified) {
      return { ok: false, error: `Your ${kind === "email" ? "email" : "mobile number"} is already verified.` };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser(kind === "email" ? { email: value } : { phone: value });
    if (error) {
      if (isTaken(error)) {
        return {
          ok: false,
          code: "exists",
          canMerge: isAdminConfigured(),
          error: `${value} is already linked to another USC account.`,
        };
      }
      return { ok: false, error: describe(error) };
    }
    return { ok: true };
  });
}

/** Confirms the code and attaches the email/phone to this account. */
export async function confirmVerificationAction(kind: ContactKind, raw: string, token: string): Promise<ContactResult> {
  return guard(async () => {
    await requireUserForMutation();
    const value = parse(kind, raw);
    if (typeof value !== "string") return value;
    const code = codeSchema(kind).safeParse(token.trim());
    if (!code.success) return { ok: false, error: code.error.issues[0].message, code: "invalid" };

    const supabase = await createSupabaseServerClient();
    const { data, error } =
      kind === "email"
        ? await supabase.auth.verifyOtp({ email: value, token: code.data, type: "email_change" })
        : await supabase.auth.verifyOtp({ phone: value, token: code.data, type: "phone_change" });
    if (error || !data.user) return { ok: false, error: error ? describe(error) : "Verification failed" };

    // Re-issue the JWT so the new identifier is in the session's claims.
    await supabase.auth.refreshSession();
    await syncProfile(data.user);
    refresh();
    return { ok: true };
  });
}

/** Sends a sign-in code to the other account that owns this email/phone. */
export async function startMergeAction(kind: ContactKind, raw: string): Promise<ContactResult> {
  return guard(async () => {
    await requireUserForMutation();
    if (!isAdminConfigured()) {
      return { ok: false, code: "unavailable", error: "Combining accounts isn't available yet." };
    }
    const value = parse(kind, raw);
    if (typeof value !== "string") return value;

    const { error } = await supabaseEphemeral().auth.signInWithOtp(
      kind === "email"
        ? { email: value, options: { shouldCreateUser: false } }
        : { phone: value, options: { shouldCreateUser: false, channel: "sms" } },
    );
    if (error) return { ok: false, error: describe(error) };
    return { ok: true };
  });
}

/**
 * Verifies ownership of the other account, then merges this (newer, duplicate)
 * account into it and continues signed in as the merged account.
 */
export async function completeMergeAction(
  kind: ContactKind,
  raw: string,
  token: string,
  next?: string,
): Promise<ContactResult> {
  return guard(async () => {
    const current = await requireUserForMutation();
    const admin = supabaseAdmin();
    if (!admin) return { ok: false, code: "unavailable", error: "Combining accounts isn't available yet." };

    const value = parse(kind, raw);
    if (typeof value !== "string") return value;
    const code = codeSchema(kind).safeParse(token.trim());
    if (!code.success) return { ok: false, error: code.error.issues[0].message, code: "invalid" };

    // 1. Prove ownership of the other account (does not touch our cookies).
    const ephemeral = supabaseEphemeral();
    const verified =
      kind === "email"
        ? await ephemeral.auth.verifyOtp({ email: value, token: code.data, type: "email" })
        : await ephemeral.auth.verifyOtp({ phone: value, token: code.data, type: "sms" });
    if (verified.error || !verified.data.user || !verified.data.session) {
      return { ok: false, error: verified.error ? describe(verified.error) : "Verification failed" };
    }
    const survivor = verified.data.user;
    if (survivor.id === current.id) return { ok: true, redirectTo: safeNext(next) };

    // 2. Read the duplicate's identifiers before it's deleted.
    const { data: dupData, error: dupError } = await admin.auth.admin.getUserById(current.id);
    if (dupError || !dupData.user) return { ok: false, error: "We couldn't read your current account. Try again." };
    const duplicate = dupData.user;
    const carryEmail = !survivor.email && duplicate.email && duplicate.email_confirmed_at ? duplicate.email : null;
    const carryPhone = !survivor.phone && duplicate.phone && duplicate.phone_confirmed_at ? duplicate.phone : null;

    // 3. Move app data, then delete the duplicate so its identifiers are free.
    await mergeAccountData(duplicate.id, survivor.id);
    const { error: deleteError } = await admin.auth.admin.deleteUser(duplicate.id);
    if (deleteError) {
      console.error("[merge] deleteUser", deleteError);
      return { ok: false, error: "Your data was moved, but we couldn't finish combining accounts. Try again." };
    }

    // 4. Attach the duplicate's verified identifier(s) to the surviving account.
    const survivorMeta = survivor.user_metadata ?? {};
    const duplicateMeta = duplicate.user_metadata ?? {};
    const { error: updateError } = await admin.auth.admin.updateUserById(survivor.id, {
      ...(carryEmail ? { email: carryEmail, email_confirm: true } : {}),
      ...(carryPhone ? { phone: carryPhone, phone_confirm: true } : {}),
      user_metadata: {
        ...duplicateMeta,
        ...survivorMeta,
        full_name: survivorMeta.full_name ?? duplicateMeta.full_name,
        onboarded: Boolean(survivorMeta.onboarded || duplicateMeta.onboarded),
      },
    });
    if (updateError) console.error("[merge] updateUserById", updateError);

    // 5. Continue as the merged account.
    const supabase = await createSupabaseServerClient();
    await supabase.auth.setSession({
      access_token: verified.data.session.access_token,
      refresh_token: verified.data.session.refresh_token,
    });
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.user) await syncProfile(refreshed.user);

    const status = refreshed.user ? contactStatusOf(refreshed.user) : null;

    // The older account may already use a *different* email/number; an account
    // holds one of each, so tell them which one to sign in with from now on.
    const dropped =
      !carryPhone && duplicate.phone && survivor.phone && duplicate.phone !== survivor.phone
        ? `Your account already uses ${formatPhone(`+${survivor.phone}`)}. Use that number to sign in from now on.`
        : !carryEmail && duplicate.email && survivor.email && duplicate.email !== survivor.email
          ? `Your account already uses ${survivor.email}. Use that email to sign in from now on.`
          : undefined;
    const onboarded = Boolean(refreshed.user?.user_metadata?.onboarded);
    const destination = safeNext(next);
    return {
      ok: true,
      notice: dropped,
      redirectTo:
        onboarded && status?.emailVerified && status.phoneVerified
          ? destination
          : `/onboarding?next=${encodeURIComponent(destination)}`,
    };
  });
}

function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/onboarding") ? next : "/home";
}

async function syncProfile(user: User) {
  await ensureProfile({
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  }).catch((error) => console.error("[contact] ensureProfile", error));
}
