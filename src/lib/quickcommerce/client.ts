import "server-only";
import { quickCommerceConfig } from "@/lib/env";
import type { ApiEnvelope, PlatformErrorCode } from "./types";

const REQUEST_TIMEOUT_MS = 12_000;

export class QuickCommerceError extends Error {
  constructor(
    message: string,
    readonly code: PlatformErrorCode,
    readonly status?: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "QuickCommerceError";
  }
}

const STATUS_TO_CODE: Record<number, PlatformErrorCode> = {
  401: "unauthorized",
  402: "no_credits",
  404: "not_found",
  422: "invalid",
  429: "rate_limited",
  502: "upstream",
  504: "timeout",
};

type Query = Record<string, string | number | boolean | undefined>;

/**
 * Thin, typed wrapper around the QuickCommerce REST API.
 * Handles auth, the pincode header, timeouts and error normalisation.
 */
export async function qcRequest<T>(
  path: string,
  query: Query,
  { pincode }: { pincode?: string } = {},
): Promise<T> {
  const { apiKey, baseUrl } = quickCommerceConfig();
  if (!apiKey) {
    throw new QuickCommerceError("QUICKCOMMERCE_API_KEY is not set", "unauthorized");
  }

  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  if (pincode) url.searchParams.set("pincode", pincode);

  const headers: HeadersInit = { "X-API-Key": apiKey, Accept: "application/json" };
  if (pincode) headers["x-geolocation-pincode"] = pincode;

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      cache: "no-store", // caching is handled one level up with `use cache`
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new QuickCommerceError(
      timedOut ? "Platform took too long to respond" : "Could not reach QuickCommerce API",
      timedOut ? "timeout" : "upstream",
    );
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;

  if (!response.ok) {
    throw new QuickCommerceError(
      extractMessage(body) ?? `QuickCommerce API responded with ${response.status}`,
      STATUS_TO_CODE[response.status] ?? (response.status >= 500 ? "upstream" : "unknown"),
      response.status,
      requestId,
    );
  }

  // Most endpoints wrap results in `data`; group endpoints sometimes do not.
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data as T;
  }
  return body as T;
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object") {
    const nested = (record.error as Record<string, unknown>).message;
    if (typeof nested === "string") return nested;
  }
  return undefined;
}
