import Link from "next/link";
import { useId } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * USC mark: a shopping bag carrying a check — "the best deal, confirmed" —
 * on an indigo squircle. Kept in sync with `src/app/icon.svg`.
 */
export function LogoMark({ className }: { className?: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9 shrink-0", className)}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4255EA" />
          <stop offset="1" stopColor="#2230A6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradient})`} />
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
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[1.15rem] font-extrabold tracking-[-0.02em]">
            USC<span className="text-deal">.</span>
          </span>
          <span className="mt-0.5 hidden text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:block">
            Ultimate Shopping Centre
          </span>
        </span>
      )}
    </Link>
  );
}
