import { z } from "zod";
import type { GeoLocation } from "@/lib/quickcommerce/types";

export const LOCATION_COOKIE = "usc_location";

export const CITY_PRESETS: GeoLocation[] = [
  { label: "Bengaluru", lat: 12.9716, lon: 77.5946, pincode: "560001" },
  { label: "Mumbai", lat: 19.076, lon: 72.8777, pincode: "400001" },
  { label: "Delhi", lat: 28.6139, lon: 77.209, pincode: "110001" },
  { label: "Gurugram", lat: 28.4595, lon: 77.0266, pincode: "122001" },
  { label: "Noida", lat: 28.5355, lon: 77.391, pincode: "201301" },
  { label: "Hyderabad", lat: 17.385, lon: 78.4867, pincode: "500001" },
  { label: "Chennai", lat: 13.0827, lon: 80.2707, pincode: "600001" },
  { label: "Pune", lat: 18.5204, lon: 73.8567, pincode: "411001" },
  { label: "Kolkata", lat: 22.5726, lon: 88.3639, pincode: "700001" },
  { label: "Ahmedabad", lat: 23.0225, lon: 72.5714, pincode: "380001" },
];

export const DEFAULT_LOCATION: GeoLocation = CITY_PRESETS[0];

export const locationSchema = z.object({
  label: z.string().trim().min(1).max(60),
  lat: z.coerce.number().min(6).max(37.5),
  lon: z.coerce.number().min(68).max(97.5),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

export function parseLocationCookie(value: string | undefined): GeoLocation {
  if (!value) return DEFAULT_LOCATION;
  try {
    const parsed = locationSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}
