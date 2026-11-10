import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

/**
 * Service-role client for privileged operations (account merges). Server-only;
 * returns null when SUPABASE_SERVICE_ROLE_KEY isn't configured so callers can
 * degrade gracefully.
 */
export function supabaseAdmin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(supabaseConfig().url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * A throwaway, cookie-less client. Used to prove ownership of *another*
 * account (send/verify a code) without touching the current session.
 */
export function supabaseEphemeral(): SupabaseClient {
  const { url, key } = supabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
