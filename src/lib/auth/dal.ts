import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Data Access Layer for authentication. Every server action, route handler and
 * page that touches user data goes through these helpers, so authorisation is
 * always verified server-side, close to the data.
 */

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

/** Validated user for this request, or null. Deduplicated per render. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) || null,
    phone: (claims.phone as string | undefined) || null,
    name: typeof metadata.full_name === "string" ? metadata.full_name : null,
  };
});

/** For pages: redirects to login (preserving the destination) when signed out. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/** Creates or refreshes the profile row that owns the user's cart and wishlist. */
export async function ensureProfile(user: SessionUser) {
  const phone = user.phone ? (user.phone.startsWith("+") ? user.phone : `+${user.phone}`) : null;
  await db.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email, phone, fullName: user.name },
    update: {
      email: user.email ?? undefined,
      phone: phone ?? undefined,
      ...(user.name ? { fullName: user.name } : {}),
    },
  });
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You need to sign in to do that.");
    this.name = "UnauthorizedError";
  }
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requireUserForMutation(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
