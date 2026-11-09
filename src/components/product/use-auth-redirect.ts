"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

/** Sends signed-out shoppers to login and brings them back afterwards. */
export function useAuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (message = "Sign in to continue") => {
      const query = searchParams.toString();
      const next = query ? `${pathname}?${query}` : pathname;
      toast.info(message);
      router.push(`/login?next=${encodeURIComponent(next)}`);
    },
    [pathname, router, searchParams],
  );
}
