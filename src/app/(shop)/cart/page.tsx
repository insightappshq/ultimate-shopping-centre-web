import { CheckCircle2Icon, ExternalLinkIcon, InfoIcon, ShoppingCartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CheckoutAssistant } from "@/components/cart/checkout-assistant";
import { ClearOrderedButton } from "@/components/cart/clear-ordered-button";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/config/platforms";
import { requireUser } from "@/lib/auth/dal";
import { getCart, type CartPlatformGroup } from "@/lib/data/cart";
import { formatPrice, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </div>
  );
}

async function CartContent() {
  const user = await requireUser("/cart");
  const cart = await getCart(user.id);

  if (!cart.items.length) {
    return (
      <EmptyState
        icon={ShoppingCartIcon}
        title="Your cart is empty"
        description="Search for a product, compare prices, and add the best deal from any platform."
      >
        <Button asChild size="xl">
          <Link href="/search">Start comparing</Link>
        </Button>
        <Button asChild size="xl" variant="outline">
          <Link href="/wishlist">View wishlist</Link>
        </Button>
      </EmptyState>
    );
  }

  const orderedCount = cart.items.length - cart.pendingCount;
  const checkoutQueue = cart.groups.flatMap((g) => g.items);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your cart"
        description={`${pluralize(cart.itemCount, "item")} across ${pluralize(cart.groups.length, "platform")}`}
      />

      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-secondary/60 p-4 text-sm">
        <InfoIcon className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
        <p className="text-secondary-foreground">
          USC doesn&apos;t take payments. You place each order on the platform&apos;s own site or app — use{" "}
          <strong>guided checkout</strong> to step through every item, or open each platform below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-4">
          {cart.groups.map((group) => (
            <PlatformGroup key={group.platform} group={group} />
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24" aria-label="Order summary">
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              {cart.groups.map((group) => (
                <div key={group.platform} className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <PlatformLogo platform={group.platform} size="xs" />
                    {PLATFORMS[group.platform].shortName}
                  </dt>
                  <dd className="tabular">{formatPrice(group.subtotal)}</dd>
                </div>
              ))}
              {cart.savings > 0 && (
                <div className="flex justify-between border-t pt-2.5 text-success">
                  <dt>Savings vs MRP</dt>
                  <dd className="font-semibold tabular">−{formatPrice(cart.savings)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t pt-2.5">
                <dt className="font-semibold">Estimated total</dt>
                <dd className="price text-2xl">{formatPrice(cart.total)}</dd>
              </div>
              {orderedCount > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <dt>Still to order</dt>
                  <dd className="tabular">{formatPrice(cart.pendingTotal)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 space-y-2">
              <CheckoutAssistant items={checkoutQueue} />
              <ClearOrderedButton count={orderedCount} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Final prices, delivery fees and offers are confirmed on each platform at checkout.
            </p>
          </div>
          {cart.pendingCount === 0 && (
            <p className="flex items-center gap-2 rounded-md bg-success-subtle px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2Icon className="size-4" aria-hidden /> Everything in your cart is purchased.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function PlatformGroup({ group }: { group: CartPlatformGroup }) {
  const meta = PLATFORMS[group.platform];
  return (
    <section className="rounded-lg border bg-card shadow-card" aria-labelledby={`group-${group.platform}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <PlatformLogo platform={group.platform} size="lg" />
          <div>
            <h2 id={`group-${group.platform}`} className="font-semibold">
              {meta.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {pluralize(group.items.length, "item")} · {formatPrice(group.subtotal)}
              {group.pendingCount < group.items.length && ` · ${group.items.length - group.pendingCount} purchased`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="lg" asChild>
          <a href={meta.homepage} target="_blank" rel="noopener noreferrer nofollow">
            Open {meta.shortName}
            <ExternalLinkIcon data-icon="inline-end" className="opacity-60" />
          </a>
        </Button>
      </header>
      <ul className="divide-y px-4 sm:px-5">
        {group.items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
