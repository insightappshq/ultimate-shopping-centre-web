import { UserRoundCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireUser } from "@/lib/auth/dal";
import { getProfile } from "@/lib/data/profile";
import { fallbackTo } from "@/lib/errors";
import { formatPhone } from "@/lib/format";
import type { GeoLocation } from "@/lib/quickcommerce/types";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false } };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <div className="w-full max-w-lg">
      <div className="rounded-3xl border bg-card p-6 shadow-elevated sm:p-8">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <UserRoundCheckIcon className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">Let&apos;s set up your profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Two quick details and you&apos;re in. We&apos;ll use them to personalise prices, stock and delivery times for
          you.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-muted" />}>
            <OnboardingContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        You can change these any time from your account.
      </p>
    </div>
  );
}

async function OnboardingContent({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const [user, { next }] = await Promise.all([requireUser("/onboarding"), searchParams]);
  const profile = await getProfile(user.id).catch(fallbackTo(null));

  const saved: GeoLocation | null =
    profile?.pincode && profile.latitude !== null && profile.longitude !== null
      ? { label: profile.locationLabel ?? "Saved location", lat: profile.latitude, lon: profile.longitude, pincode: profile.pincode }
      : null;

  return (
    <OnboardingForm
      initialName={profile?.fullName ?? user.name ?? ""}
      initialLocation={saved}
      identity={user.email ?? (user.phone ? formatPhone(user.phone) : "your account")}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
