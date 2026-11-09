"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import { clearSearchHistory, updateProfileName } from "@/lib/data/profile";
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
