import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseConfig } from "./config";

/** Pages anyone can open. Everything else requires a signed-in shopper. */
const PUBLIC_PAGES = new Set(["/", "/terms", "/cookies", "/forgot-password"]);
/** Sign-in pages: signed-in users are sent on into the app. */
const AUTH_PAGES = new Set(["/login", "/signup"]);
/** Prefixes that handle their own auth (callbacks, webhooks, health checks). */
const PUBLIC_PREFIXES = ["/auth/", "/api/auth/", "/api/health"];

export const APP_HOME = "/home";
export const ONBOARDING = "/onboarding";

function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

/**
 * Runs on every request:
 *  1. refreshes the Supabase session cookie;
 *  2. gates the app behind sign-in (pages redirect to /login, APIs get 401);
 *  3. sends shoppers who haven't completed their profile — or haven't verified
 *     both their email and mobile number — to /onboarding.
 *
 * These are optimistic checks for routing. Data access is still authorised
 * server-side in the DAL (`src/lib/auth/dal.ts`).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Without Supabase there is no session to refresh; pages still enforce sign-in via the DAL.
  if (!isSupabaseConfigured()) return response;

  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims() validates the JWT (locally when asymmetric keys are enabled).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isSignedIn = Boolean(claims?.sub);
  // Using the app requires a completed profile and BOTH identifiers verified.
  // JWT claims only carry an email/phone once it has been confirmed.
  const onboarded =
    Boolean((claims?.user_metadata as Record<string, unknown> | undefined)?.onboarded) &&
    Boolean(claims?.email) &&
    Boolean(claims?.phone);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (pathnameTo: string, query = "") => {
    const target = request.nextUrl.clone();
    target.pathname = pathnameTo;
    target.search = query;
    const redirect = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return response;

  if (AUTH_PAGES.has(pathname)) {
    if (!isSignedIn) return response;
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    if (!onboarded) return redirectTo(ONBOARDING, next ? `?next=${encodeURIComponent(next)}` : "");
    return redirectTo(next ?? APP_HOME);
  }

  if (PUBLIC_PAGES.has(pathname)) {
    // The landing page is for visitors; signed-in shoppers go straight to the app.
    return pathname === "/" && isSignedIn ? redirectTo(onboarded ? APP_HOME : ONBOARDING) : response;
  }

  if (!isSignedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Sign in to use this endpoint." } },
        { status: 401 },
      );
    }
    return redirectTo("/login", `?next=${encodeURIComponent(pathname + search)}`);
  }

  // Session info stays readable so clients can tell *why* they're being held at onboarding.
  if (!onboarded && pathname !== ONBOARDING && pathname !== "/api/me") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "verification_required", message: "Verify both your email and mobile number first." } },
        { status: 403 },
      );
    }
    return redirectTo(ONBOARDING, `?next=${encodeURIComponent(pathname + search)}`);
  }

  return response;
}
