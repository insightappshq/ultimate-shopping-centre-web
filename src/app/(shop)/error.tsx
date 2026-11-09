"use client";

import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-12">
      <EmptyState
        icon={TriangleAlertIcon}
        title="Something went wrong"
        description="We hit an unexpected problem loading this page. Please try again."
      >
        <Button size="xl" onClick={reset}>
          <RefreshCwIcon data-icon="inline-start" /> Try again
        </Button>
      </EmptyState>
      {error.digest && <p className="mt-3 text-center text-xs text-muted-foreground">Reference: {error.digest}</p>}
    </div>
  );
}
