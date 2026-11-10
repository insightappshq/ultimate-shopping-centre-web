import "server-only";
import { isAuthSessionMissingError, type User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContactKind, ContactStatus } from "./contact-types";

const e164 = (digits: string | null | undefined) => (digits ? `+${digits.replace(/^\+/, "")}` : null);

export function contactStatusOf(user: User): ContactStatus {
  const provider = (user.app_metadata?.provider as string | undefined) ?? (user.email ? "email" : "phone");
  return {
    primary: (provider === "phone" ? "phone" : "email") as ContactKind,
    email: user.email || null,
    emailVerified: Boolean(user.email && user.email_confirmed_at),
    pendingEmail: user.new_email || null,
    phone: e164(user.phone),
    phoneVerified: Boolean(user.phone && user.phone_confirmed_at),
    pendingPhone: e164(user.new_phone),
  };
}

/**
 * Fresh verification state from Supabase Auth (a network call — JWT claims
 * don't carry confirmation timestamps or pending changes).
 */
export async function getContactStatus(): Promise<ContactStatus | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (data.user) return contactStatusOf(data.user);
  // No session → null (callers send the user to sign in). Anything else — a
  // network or Supabase outage — must not look like "signed out": the proxy
  // still sees a valid session and would bounce /login ↔ /onboarding forever.
  if (!error || isAuthSessionMissingError(error) || error.status === 401 || error.status === 403) return null;
  throw error;
}
