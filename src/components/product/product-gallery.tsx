"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto sm:max-h-[28rem] sm:flex-col sm:overflow-y-auto" aria-label="Product images">
          {images.slice(0, 8).map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl border-2 bg-white transition",
                  index === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <ProductImage src={src} alt="" sizes="64px" className="p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-white">
        <ProductImage src={current} alt={name} sizes="(max-width: 1024px) 100vw, 520px" priority className="p-6" />
      </div>
    </div>
  );
}
