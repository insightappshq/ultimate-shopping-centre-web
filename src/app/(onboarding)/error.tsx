"use client";

import { RouteError } from "@/components/common/route-error";

export default function OnboardingError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      {...props}
      description="We couldn’t load your profile setup. Any email or mobile number you verified is kept. Please try again."
    />
  );
}
