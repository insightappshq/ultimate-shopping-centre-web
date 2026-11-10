"use client";

import { RouteError } from "@/components/common/route-error";

export default function ShopError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page">
      <RouteError {...props} />
    </div>
  );
}
