"use client";

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  Loader2Icon,
  PartyPopperIcon,
  RocketIcon,
  SkipForwardIcon,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { markCartItemOrderedAction } from "@/actions/cart";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PLATFORMS } from "@/config/platforms";
import type { CartItem } from "@/lib/data/cart";
import { formatPrice } from "@/lib/format";

/**
 * Walks the shopper through each pending item, platform by platform: open the
 * listing on the platform, add it to that platform's cart, mark it purchased.
 */
export function CheckoutAssistant({ items }: { items: CartItem[] }) {
  const pendingItems = useMemo(() => items.filter((i) => i.status === "PENDING"), [items]);
  // Snapshot the queue when the dialog opens; the cart re-renders as items are marked.
  const [queue, setQueue] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const current = queue[index];
  const finished = index >= queue.length;
  const meta = current ? PLATFORMS[current.platform] : null;
  const isLastForPlatform = current && queue[index + 1]?.platform !== current.platform;

  const reset = (value: boolean) => {
    setOpen(value);
    if (value) {
      setQueue(pendingItems);
      setIndex(0);
      setOpened(false);
      setDone([]);
    }
  };

  const advance = () => {
    setOpened(false);
    setIndex((i) => i + 1);
  };

  const markPurchased = () => {
    if (!current) return;
    startTransition(async () => {
      const result = await markCartItemOrderedAction(current.id, true);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDone((d) => [...d, current.id]);
      advance();
    });
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button size="xl" className="w-full" disabled={!pendingItems.length}>
          <RocketIcon data-icon="inline-start" />
          Start guided checkout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {finished ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-lg bg-success-subtle text-success">
              <PartyPopperIcon className="size-7" aria-hidden />
            </span>
            <DialogHeader className="mt-4 items-center">
              <DialogTitle>All done!</DialogTitle>
              <DialogDescription>
                You marked {done.length} of {queue.length} items as purchased.
                {done.length < queue.length && " Skipped items stay in your cart."}
              </DialogDescription>
            </DialogHeader>
            <Button size="xl" className="mt-6 w-full" onClick={() => reset(false)}>
              Back to cart
            </Button>
          </div>
        ) : current && meta ? (
          <>
            <DialogHeader>
              <DialogTitle>Guided checkout</DialogTitle>
              <DialogDescription>
                Item {index + 1} of {queue.length} · Order on {meta.name}, then come back here.
              </DialogDescription>
            </DialogHeader>
            <Progress value={(index / queue.length) * 100} aria-label="Checkout progress" />

            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <PlatformLogo platform={current.platform} size="sm" />
                {meta.name}
              </div>
              <div className="flex gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-white">
                  <ProductImage src={current.image} alt={current.name} sizes="80px" />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-medium">{current.name}</p>
                  {current.packSize && <p className="text-xs text-muted-foreground">{current.packSize}</p>}
                  <p className="mt-1 text-sm">
                    <span className="price">{formatPrice(current.price)}</span>
                    <span className="text-muted-foreground"> × {current.quantity}</span>
                  </p>
                </div>
              </div>
            </div>

            <ol className="space-y-2 text-sm">
              <Step n={1} active={!opened}>
                Open the product on {meta.shortName} and add <strong>{current.quantity}</strong> to your cart there.
              </Step>
              <Step n={2} active={opened}>
                {isLastForPlatform
                  ? `That's the last ${meta.shortName} item — complete payment on ${meta.shortName}.`
                  : `Keep the ${meta.shortName} tab open; more items from ${meta.shortName} are next.`}
              </Step>
            </ol>

            <div className="grid gap-2">
              <Button size="xl" variant={opened ? "outline" : "default"} asChild>
                <a
                  href={current.deeplink ?? meta.homepage}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  onClick={() => setOpened(true)}
                >
                  Open on {meta.shortName}
                  <ExternalLinkIcon data-icon="inline-end" />
                </a>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button size="lg" variant="ghost" onClick={advance} disabled={pending}>
                  <SkipForwardIcon data-icon="inline-start" /> Skip
                </Button>
                <Button size="lg" variant={opened ? "success" : "secondary"} onClick={markPurchased} disabled={pending}>
                  {pending ? (
                    <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <CheckCircle2Icon data-icon="inline-start" />
                  )}
                  Purchased
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, active, children }: { n: number; active: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span
        className={
          active
            ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.68rem] font-bold text-primary-foreground"
            : "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.68rem] font-bold text-muted-foreground"
        }
      >
        {n}
      </span>
      <span className={active ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
