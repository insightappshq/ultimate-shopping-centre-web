import { AlertCircleIcon } from "lucide-react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORMS } from "@/config/platforms";
import type { PlatformStatus } from "@/lib/quickcommerce/types";
import { cn } from "@/lib/utils";

const ERROR_COPY: Record<string, string> = {
  no_credits: "out of API credits",
  unauthorized: "API key not accepted",
  not_found: "not serviceable",
  unavailable: "not serviceable",
  invalid: "needs a pincode",
  rate_limited: "busy",
  timeout: "timed out",
  upstream: "unavailable",
};

/** One chip per platform: how many results it returned, or why it didn't. */
export function PlatformStatusBar({ statuses }: { statuses: PlatformStatus[] }) {
  return (
    <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Results per platform">
      {statuses.map((status) => (
        <li
          key={status.platform}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border bg-card py-1 pr-2.5 pl-1 text-xs",
            !status.ok && "border-warning/40 bg-warning-subtle",
          )}
        >
          <PlatformLogo platform={status.platform} size="xs" className="rounded-full" />
          <span className="font-medium">{PLATFORMS[status.platform].shortName}</span>
          {status.ok ? (
            <span className="text-muted-foreground tabular">{status.count}</span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-warning">
              <AlertCircleIcon className="size-3" aria-hidden />
              {ERROR_COPY[status.error ?? ""] ?? "unavailable"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
