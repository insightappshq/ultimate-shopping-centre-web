"use client";

import { RouteError } from "@/components/common/route-error";

export default function AuthError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} description="We couldn't reach the sign-in service. Please try again." />;
}
