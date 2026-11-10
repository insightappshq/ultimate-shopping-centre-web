import { BadgeCheckIcon, InfoIcon } from "lucide-react";
import { SectionHeader } from "@/components/common/page-header";
import { PLATFORMS } from "@/config/platforms";
import { formatCount, formatPrice } from "@/lib/format";
import type { ProductDetail, ProductSpec } from "@/lib/quickcommerce/types";
import { cn } from "@/lib/utils";

/** India's FSSAI veg / non-veg mark. Returns null for other dietary labels. */
export function FoodMark({ labels, className }: { labels: string[]; className?: string }) {
  const nonVeg = labels.some((l) => /non[\s-]?veg|egg/i.test(l));
  const veg = !nonVeg && labels.some((l) => /\bveg(etarian|an)?\b/i.test(l));
  if (!veg && !nonVeg) return null;
  const label = nonVeg ? "Non-vegetarian" : "Vegetarian";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white",
        nonVeg ? "border-[#8b3a1e]" : "border-[#1a8f3c]",
        className,
      )}
    >
      {nonVeg ? (
        <span className="size-0 border-x-[4px] border-b-[7px] border-x-transparent border-b-[#8b3a1e]" />
      ) : (
        <span className="size-2 rounded-full bg-[#1a8f3c]" />
      )}
    </span>
  );
}

/** Platform assurances, e.g. "Genuine Product", "7 days Return". */
export function AssuranceBadges({ badges }: { badges: string[] }) {
  if (!badges.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Platform assurances">
      {badges.map((badge) => (
        <li key={badge} className="inline-flex items-center gap-1.5">
          <BadgeCheckIcon className="size-3.5 text-success" aria-hidden />
          {badge}
        </li>
      ))}
    </ul>
  );
}

function groupSpecs(specs: ProductSpec[]): [string, ProductSpec[]][] {
  const groups = new Map<string, ProductSpec[]>();
  for (const spec of specs) groups.set(spec.group, [...(groups.get(spec.group) ?? []), spec]);
  return [...groups.entries()];
}

export function ProductDetails({ product }: { product: ProductDetail }) {
  const meta = PLATFORMS[product.platform];
  const { info } = product;

  const glance: ProductSpec[] = [
    { label: "Brand", value: product.brand ?? "—" },
    { label: "Pack size", value: product.quantity ?? "—" },
    { label: "Sold on", value: meta.name },
    { label: "Availability", value: product.available ? "In stock" : "Out of stock" },
    ...(product.inventory !== null ? [{ label: "Units in stock", value: String(product.inventory) }] : []),
    ...(product.rating
      ? [{ label: "Rating", value: `${product.rating} / 5${product.ratingCount ? ` (${formatCount(product.ratingCount)} ratings)` : ""}` }]
      : []),
    ...(product.mrp ? [{ label: "MRP", value: formatPrice(product.mrp) }] : []),
    { label: "Delivery", value: product.eta ?? meta.typicalEta },
    ...(info.dietaryLabels.length ? [{ label: "Dietary", value: info.dietaryLabels.join(", ") }] : []),
    ...(product.fetchedAt ? [{ label: "Price checked", value: product.fetchedAt }] : []),
  ].map((spec) => ({ ...spec, group: "At a glance" }));

  const groups = groupSpecs([...glance, ...info.specifications]);

  return (
    <section aria-labelledby="details-heading" className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div className="space-y-5">
        <SectionHeader title={<span id="details-heading">About this product</span>} className="mb-0" />

        {info.highlights.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {info.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        )}

        {info.sections.length > 0 ? (
          <div className="space-y-5">
            {info.sections.map((section, index) => (
              <div key={`${section.heading ?? "body"}-${index}`}>
                {/* The section title already says "About this product". */}
                {section.heading && !/^about (the|this) product$/i.test(section.heading) && (
                  <h3 className="mb-1.5 text-sm font-semibold">{section.heading}</h3>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.name}
            {product.brand ? ` by ${product.brand}` : ""} is listed on {meta.name} at {formatPrice(product.price)}
            {product.discountPercent ? `, ${product.discountPercent}% below MRP` : ""}. {meta.name} hasn&apos;t
            published a description for this item.
          </p>
        )}

        {info.disclaimer && (
          <p className="flex gap-2 border-l-2 pl-3 text-xs leading-relaxed text-muted-foreground">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {info.disclaimer}
          </p>
        )}
      </div>

      <div className="self-start overflow-hidden rounded-lg border bg-card text-sm">
        {groups.map(([group, specs], index) => (
          <section key={group} aria-label={group} className={index > 0 ? "border-t" : undefined}>
            <h3 className="bg-muted/50 px-4 py-2 text-[0.8rem] font-semibold">{group}</h3>
            <dl className="divide-y divide-border/70">
              {specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2 sm:grid-cols-[11rem_1fr]">
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="break-words">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}
