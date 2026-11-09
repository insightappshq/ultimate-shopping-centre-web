import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 11.5h2.2l2.4 9.2h7.6l2-6.6H12.6"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14.6" cy="24" r="1.6" fill="white" />
      <circle cx="20.4" cy="24" r="1.6" fill="white" />
      <circle cx="24.5" cy="8.5" r="3" className="fill-deal" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[1.05rem] font-extrabold tracking-tight">USC</span>
          <span className="hidden text-[0.68rem] font-medium text-muted-foreground sm:block">
            Ultimate Shopping Centre
          </span>
        </span>
      )}
    </Link>
  );
}
