"use client";

import { useCallback, useState } from "react";

export type DeviceLocationStatus = "idle" | "locating" | "resolving" | "error";

const MESSAGES: Record<number, string> = {
  1: "Location permission was denied. Enter your pincode instead.",
  2: "We couldn't determine your location. Enter your pincode instead.",
  3: "Finding your location took too long. Try again or enter your pincode.",
};

/**
 * Reads the device position and hands it to `resolve` (a server action that
 * geocodes it to a pincode). Tracks progress so UIs can show what's happening.
 */
export function useDeviceLocation<T>(resolve: (lat: number, lon: number) => Promise<T>) {
  const [status, setStatus] = useState<DeviceLocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async (): Promise<T | null> => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      setError("Location isn't available in this browser. Enter your pincode instead.");
      return null;
    }
    setStatus("locating");
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((ok, fail) =>
        navigator.geolocation.getCurrentPosition(ok, fail, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 120_000,
        }),
      );
      setStatus("resolving");
      const result = await resolve(position.coords.latitude, position.coords.longitude);
      setStatus("idle");
      return result;
    } catch (cause) {
      setStatus("error");
      const code = (cause as GeolocationPositionError | undefined)?.code;
      setError(MESSAGES[code ?? 0] ?? "Something went wrong detecting your location.");
      return null;
    }
  }, [resolve]);

  return { locate, status, error, busy: status === "locating" || status === "resolving" };
}
