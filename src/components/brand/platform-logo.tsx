import Image from "next/image";
import { PLATFORMS, type PlatformId } from "@/config/platforms";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-4 rounded-[4px]",
  sm: "size-5 rounded-md",
  md: "size-7 rounded-lg",
  lg: "size-10 rounded-xl",
  xl: "size-14 rounded-2xl",
} as const;

const PIXELS = { xs: 16, sm: 20, md: 28, lg: 40, xl: 56 } as const;

export function PlatformLogo({
  platform,
  size = "md",
  className,
}: {
  platform: PlatformId;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const meta = PLATFORMS[platform];
  return (
    <Image
      src={meta.logo}
      alt={meta.name}
      width={PIXELS[size]}
      height={PIXELS[size]}
      className={cn("shrink-0 bg-white object-contain ring-1 ring-black/5", SIZES[size], className)}
    />
  );
}

/** Logo with the platform name, for table rows and group headers. */
export function PlatformLabel({
  platform,
  size = "sm",
  short = false,
  className,
  children,
}: {
  platform: PlatformId;
  size?: keyof typeof SIZES;
  short?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const meta = PLATFORMS[platform];
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <PlatformLogo platform={platform} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{short ? meta.shortName : meta.name}</span>
        {children}
      </span>
    </span>
  );
}

/** Overlapping logos, e.g. "available on" stacks in product cards. */
export function PlatformStack({
  platforms,
  max = 4,
  size = "sm",
}: {
  platforms: PlatformId[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = platforms.slice(0, max);
  const extra = platforms.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((platform, i) => (
        <PlatformLogo
          key={platform}
          platform={platform}
          size={size}
          className={cn("ring-2 ring-card", i > 0 && "-ml-1.5")}
        />
      ))}
      {extra > 0 && (
        <span className="-ml-1.5 flex size-5 items-center justify-center rounded-md bg-muted text-[0.6rem] font-semibold text-muted-foreground ring-2 ring-card">
          +{extra}
        </span>
      )}
    </span>
  );
}
