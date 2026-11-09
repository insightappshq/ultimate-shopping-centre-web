import { ExternalLinkIcon } from "lucide-react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { Button } from "@/components/ui/button";
import { PLATFORMS, type PlatformId } from "@/config/platforms";

/** Opens the listing on the platform's own site/app, where the order is placed. */
export function BuyOnPlatformButton({
  platform,
  href,
  compact = false,
  ...props
}: {
  platform: PlatformId;
  href: string | null;
  compact?: boolean;
} & Omit<React.ComponentProps<typeof Button>, "asChild" | "children">) {
  const meta = PLATFORMS[platform];
  const target = href ?? meta.homepage;
  return (
    <Button variant="outline" {...props} asChild>
      <a href={target} target="_blank" rel="noopener noreferrer nofollow" aria-label={`Buy on ${meta.name} (opens in a new tab)`}>
        {!compact && <PlatformLogo platform={platform} size="xs" />}
        {compact ? "Buy" : `Buy on ${meta.shortName}`}
        <ExternalLinkIcon data-icon="inline-end" className="opacity-60" />
      </a>
    </Button>
  );
}
