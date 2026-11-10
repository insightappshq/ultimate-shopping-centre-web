"use client";

import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

/** Shared body for route-group `error.tsx` boundaries: explains, logs, offers a retry. */
export function RouteError({
  error,
  reset,
  description = "We hit an unexpected problem loading this page. Please try again.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-full py-12">
      <EmptyState icon={TriangleAlertIcon} title="Something went wrong" description={description}>
        <Button size="xl" onClick={reset}>
          <RefreshCwIcon data-icon="inline-start" /> Try again
        </Button>
      </EmptyState>
      {error.digest && <p className="mt-3 text-center text-xs text-muted-foreground">Reference: {error.digest}</p>}
    </div>
  );
}
