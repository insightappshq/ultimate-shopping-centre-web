"use client";

import { PackageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { isOptimizedImageHost } from "@/config/image-hosts";
import { cn } from "@/lib/utils";

/**
 * Product photo with a graceful placeholder. Known platform CDNs go through the
 * Next.js optimizer; unknown hosts are rendered directly so they never break.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 240px",
  priority = false,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-muted/40 text-muted-foreground/40",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <PackageIcon className="size-8" strokeWidth={1.25} aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizedImageHost(src)}
      onError={() => setFailed(true)}
      className={cn("object-contain p-2", className)}
    />
  );
}
