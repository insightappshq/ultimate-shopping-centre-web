import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * USC mark: a shopping bag carrying a check — "the best deal, confirmed" —
 * on an indigo squircle. Kept in sync with `src/app/icon.svg`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="40" height="40" rx="9" fill="#3141D4" />
      <path
        d="M15 15.5v-2a5 5 0 0 1 10 0v2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M10.6 15.5h18.8l-1.3 14.1a2.6 2.6 0 0 1-2.6 2.4H14.5a2.6 2.6 0 0 1-2.6-2.4z" fill="#fff" />
      <path
        d="m15.6 23.6 3.1 3.1 5.8-6"
        fill="none"
        stroke="#F2A13A"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark />
      {!compact && (
        <span className="flex items-baseline gap-2 leading-none">
          <span className="font-heading text-[1.2rem] font-bold tracking-[-0.03em] [font-stretch:88%]">USC</span>
          <span className="hidden text-xs font-medium text-muted-foreground xl:inline">Ultimate Shopping Centre</span>
        </span>
      )}
    </Link>
  );
}
