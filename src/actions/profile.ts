"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getContactStatus } from "@/lib/auth/contact";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import { clearSearchHistory, saveProfileLocation, updateProfileName } from "@/lib/data/profile";
import { locationSchema } from "@/lib/location";
import { saveLocation } from "@/lib/location.server";
import type { GeoLocation } from "@/lib/quickcommerce/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toActionError, type ActionResult } from "./result";

export async function updateNameAction(fullName: string): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    const name = z.string().trim().min(2, "Name is too short").max(80).parse(fullName);
    await ensureProfile(user);
    await updateProfileName(user.id, name);
    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({ data: { full_name: name } });
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function clearSearchHistoryAction(): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    await clearSearchHistory(user.id);
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  location: locationSchema,
  next: z.string().optional(),
});

/**
 * Completes first-run setup: saves the shopper's name and confirmed delivery
 * location, then marks the Supabase user as onboarded. The session is
 * refreshed so the new `onboarded` claim reaches the proxy immediately.
 */
export async function completeOnboardingAction(input: {
  fullName: string;
  location: GeoLocation;
  next?: string;
}): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const user = await requireUserForMutation();
    const { fullName, location, next } = onboardingSchema.parse(input);

    // Both identifiers must be verified so the same person can't end up with
    // separate email and phone accounts.
    const contact = await getContactStatus();
    if (!contact || !contact.emailVerified || !contact.phoneVerified) {
      return { ok: false, error: "Verify both your email address and mobile number to continue.", code: "invalid" };
    }

    await ensureProfile({ ...user, name: fullName });
    await Promise.all([
      updateProfileName(user.id, fullName),
      saveProfileLocation(user.id, location),
      saveLocation(location),
    ]);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName, onboarded: true } });
    if (error) throw error;
    // Re-issue the JWT so `user_metadata.onboarded` is in the cookie's claims.
    await supabase.auth.refreshSession();

    const redirectTo = next?.startsWith("/") && !next.startsWith("//") && !next.startsWith("/onboarding") ? next : "/home";
    return { ok: true, data: { redirectTo } };
  } catch (error) {
    return toActionError(error);
  }
}
