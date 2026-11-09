import "server-only";
import { cookies } from "next/headers";
import type { GeoLocation } from "@/lib/quickcommerce/types";
import { LOCATION_COOKIE, parseLocationCookie } from "./location";

/** The shopper's delivery location (cookie-backed so server components can price for it). */
export async function getLocation(): Promise<GeoLocation> {
  const store = await cookies();
  return parseLocationCookie(store.get(LOCATION_COOKIE)?.value);
}

export async function saveLocation(location: GeoLocation) {
  const store = await cookies();
  store.set(LOCATION_COOKIE, JSON.stringify(location), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
