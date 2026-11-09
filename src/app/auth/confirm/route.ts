import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Handles one-click links from auth emails (token hash or PKCE code). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const supabase = await createSupabaseServerClient();
  const { data, error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { data: { user: null }, error: new Error("Missing token") };

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=link_expired", origin));
  }

  await ensureProfile({
    id: data.user.id,
    email: data.user.email ?? null,
    phone: data.user.phone || null,
    name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
  }).catch((e) => console.error("[auth/confirm] ensureProfile", e));

  return NextResponse.redirect(new URL(type === "recovery" ? "/account?reset=1" : next, origin));
}
