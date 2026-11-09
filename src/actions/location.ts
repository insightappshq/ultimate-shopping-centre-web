"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { saveProfileLocation } from "@/lib/data/profile";
import { fallbackTo } from "@/lib/errors";
import { locationSchema } from "@/lib/location";
import { saveLocation } from "@/lib/location.server";
import type { GeoLocation } from "@/lib/quickcommerce/types";
import { toActionError, type ActionResult } from "./result";

export async function setLocationAction(input: GeoLocation): Promise<ActionResult> {
  try {
    const location = locationSchema.parse(input);
    await saveLocation(location);

    const user = await getCurrentUser();
    if (user) await saveProfileLocation(user.id, location).catch(fallbackTo(undefined));

    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
