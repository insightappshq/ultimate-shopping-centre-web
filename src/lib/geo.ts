import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site";
import type { GeoLocation } from "@/lib/quickcommerce/types";

/**
 * Geocoding for Indian delivery locations.
 *
 * - Coordinates → pincode: OpenStreetMap Nominatim reverse geocoding.
 * - Pincode → coordinates: Nominatim postal-code search, with India Post's
 *   public API for validation and a friendlier area name.
 *
 * Both are free services with fair-use limits (Nominatim: ~1 request/second,
 * identifying User-Agent required), so results are cached for weeks: a
 * pincode's location doesn't move. For high traffic, swap these functions for
 * a commercial geocoder (Google, Mapbox, Ola Maps) without touching callers.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const INDIA_POST = "https://api.postalpincode.in/pincode";
const USER_AGENT = `UltimateShoppingCentre/1.0 (+${siteConfig.url}; ${siteConfig.supportEmail})`;
const TIMEOUT_MS = 8000;

const PINCODE = /^[1-9]\d{5}$/;

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", "Accept-Language": "en-IN,en" },
    cache: "no-store", // cached one level up with `use cache`
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new GeocodingError(`Geocoder responded with ${response.status}`);
  return (await response.json()) as T;
}

interface NominatimAddress {
  postcode?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  country_code?: string;
}

function normalisePincode(raw: string | undefined): string | null {
  const digits = raw?.replace(/\s+/g, "") ?? "";
  return PINCODE.test(digits) ? digits : null;
}

/** "Koramangala, Bengaluru" — area plus city, skipping administrative zones. */
function areaLabel(address: NominatimAddress): string {
  const area = address.suburb ?? address.neighbourhood ?? address.quarter ?? address.village;
  const city =
    address.city ??
    address.town ??
    address.state_district?.replace(/\s+(City|Suburban|Urban)?\s*District$/i, "") ??
    address.county ??
    address.state;
  const parts = [area, city].filter((part, i, all): part is string => Boolean(part) && all.indexOf(part) === i);
  return parts.join(", ") || "Current location";
}

const round = (value: number) => Math.round(value * 10_000) / 10_000; // ~11 m

/** Coordinates → nearest pincode and a readable area name. */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  return reverseGeocodeCached(round(lat), round(lon));
}

async function reverseGeocodeCached(lat: number, lon: number): Promise<GeoLocation> {
  "use cache";
  cacheLife("weeks");
  cacheTag("geo:reverse");

  const result = await getJson<{ address?: NominatimAddress; error?: string }>(
    `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=16&lat=${lat}&lon=${lon}`,
  );
  const address = result.address;
  if (!address || address.country_code !== "in") {
    throw new GeocodingError("USC currently delivers comparisons for locations in India only.");
  }
  const pincode = normalisePincode(address.postcode);
  if (!pincode) throw new GeocodingError("We couldn't find a pincode for this location. Please enter it.");
  return { label: areaLabel(address), lat, lon, pincode };
}

interface IndiaPostResponse {
  Status: string;
  PostOffice: { Name: string; District: string; State: string }[] | null;
}

/** Pincode → coordinates and a readable area name. */
export async function geocodePincode(pincode: string): Promise<GeoLocation> {
  if (!PINCODE.test(pincode)) throw new GeocodingError("Enter a valid 6-digit pincode.");
  return geocodePincodeCached(pincode);
}

async function geocodePincodeCached(pincode: string): Promise<GeoLocation> {
  "use cache";
  cacheLife("weeks");
  cacheTag("geo:pincode");

  const [places, post] = await Promise.all([
    getJson<{ lat: string; lon: string; address?: NominatimAddress }[]>(
      `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&postalcode=${pincode}`,
    ),
    getJson<IndiaPostResponse[]>(`${INDIA_POST}/${pincode}`).catch(() => null),
  ]);

  const office = post?.[0]?.Status === "Success" ? post[0].PostOffice?.[0] : undefined;
  const place = places[0];
  if (!place) {
    throw new GeocodingError(
      office
        ? "We couldn't locate this pincode on the map. Use your current location instead."
        : "We couldn't find that pincode. Please check it and try again.",
    );
  }

  const label = office ? `${office.Name}, ${office.District}` : place.address ? areaLabel(place.address) : pincode;
  return { label, lat: round(Number(place.lat)), lon: round(Number(place.lon)), pincode };
}
