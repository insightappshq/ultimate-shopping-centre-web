import "server-only";
import { db } from "@/lib/db";

export interface ExistingAccount {
  id: string;
  /** The identifier itself has been confirmed (email verified / phone verified). */
  confirmed: boolean;
  hasPassword: boolean;
}

/**
 * Looks up an auth account by email or phone, server-side only.
 *
 * Supabase deliberately hides whether an account exists (sign-up with a taken
 * email "succeeds" without sending anything; a missing account and a wrong
 * password give the same error). USC needs the answer to route people to the
 * right flow, so it reads `auth.users` directly over the app's privileged
 * database connection. Results never leave the server except as the route
 * the UI takes.
 */
export async function findAccount(
  identifier: { email: string } | { phone: string },
): Promise<ExistingAccount | null> {
  const rows =
    "email" in identifier
      ? await db.$queryRaw<{ id: string; confirmed: boolean; has_password: boolean }[]>`
          SELECT id, email_confirmed_at IS NOT NULL AS confirmed,
                 coalesce(encrypted_password, '') <> '' AS has_password
          FROM auth.users
          WHERE lower(email) = lower(${identifier.email}) AND deleted_at IS NULL
          LIMIT 1`
      : await db.$queryRaw<{ id: string; confirmed: boolean; has_password: boolean }[]>`
          SELECT id, phone_confirmed_at IS NOT NULL AS confirmed,
                 coalesce(encrypted_password, '') <> '' AS has_password
          FROM auth.users
          WHERE phone = ${identifier.phone.replace(/\D/g, "")} AND deleted_at IS NULL
          LIMIT 1`;
  const row = rows[0];
  return row ? { id: row.id, confirmed: row.confirmed, hasPassword: row.has_password } : null;
}
