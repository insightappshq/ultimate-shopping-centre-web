"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dal";
import { saveProfileLocation } from "@/lib/data/profile";
import { fallbackTo, rethrowNextErrors } from "@/lib/errors";
import { geocodePincode, reverseGeocode } from "@/lib/geo";
import { locationSchema } from "@/lib/location";
import { saveLocation } from "@/lib/location.server";
import type { GeoLocation } from "@/lib/quickcommerce/types";
import { toActionError, type ActionResult } from "./result";

async function persist(location: GeoLocation) {
  await saveLocation(location);
  const user = await getCurrentUser();
  if (user) await saveProfileLocation(user.id, location).catch(fallbackTo(undefined));
}

function geocodingFailure(error: unknown): Extract<ActionResult, { ok: false }> {
  rethrowNextErrors(error);
  if (error instanceof Error && error.name === "GeocodingError") {
    return { ok: false, error: error.message, code: "invalid" };
  }
  console.error("[location]", error);
  return { ok: false, error: "Location lookup is unavailable right now. Please enter your pincode.", code: "server" };
}

const coordsSchema = z.object({
  lat: z.number().min(6).max(37.5),
  lon: z.number().min(68).max(97.5),
});

/** Resolves a pincode (via geocoding) without saving it — used to pre-fill forms. */
export async function resolveCoordinatesAction(lat: number, lon: number): Promise<ActionResult<GeoLocation>> {
  try {
    const coords = coordsSchema.parse({ lat, lon });
    return { ok: true, data: await reverseGeocode(coords.lat, coords.lon) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: "USC currently supports delivery locations in India only.", code: "invalid" };
    }
    return geocodingFailure(error);
  }
}

/** Resolves a typed pincode to coordinates without saving — used to confirm it in forms. */
export async function resolvePincodeAction(pincode: string): Promise<ActionResult<GeoLocation>> {
  try {
    return { ok: true, data: await geocodePincode(pincode.trim()) };
  } catch (error) {
    return geocodingFailure(error);
  }
}

/** Device location → pincode, saved as the delivery location. */
export async function applyDeviceLocationAction(lat: number, lon: number): Promise<ActionResult<GeoLocation>> {
  const resolved = await resolveCoordinatesAction(lat, lon);
  if (!resolved.ok) return resolved;
  try {
    await persist(resolved.data);
    refresh();
    return resolved;
  } catch (error) {
    return toActionError(error);
  }
}

/** Typed pincode → coordinates, saved as the delivery location. */
export async function setPincodeAction(pincode: string): Promise<ActionResult<GeoLocation>> {
  let location: GeoLocation;
  try {
    location = await geocodePincode(pincode.trim());
  } catch (error) {
    return geocodingFailure(error);
  }
  try {
    await persist(location);
    refresh();
    return { ok: true, data: location };
  } catch (error) {
    return toActionError(error);
  }
}

/** A preset city (already has coordinates and a pincode). */
export async function setLocationAction(input: GeoLocation): Promise<ActionResult> {
  try {
    await persist(locationSchema.parse(input));
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
