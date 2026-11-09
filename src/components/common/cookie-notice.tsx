"use client";

import { CookieIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const KEY = "usc:cookie-notice";
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "dismissed";
  } catch {
    return true; // storage blocked: don't nag on every page
  }
}

function dismiss() {
  try {
    localStorage.setItem(KEY, "dismissed");
  } catch {
    // ignore
  }
  for (const listener of listeners) listener();
}

/**
 * Notice for essential cookies. USC sets no optional cookies, so this informs
 * rather than asks for consent; it links to the full Cookie Policy.
 */
export function CookieNotice() {
  const dismissed = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readDismissed,
    () => true, // server: render nothing
  );
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-2xl border bg-popover p-4 shadow-elevated md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <CookieIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <p className="flex-1 text-sm text-muted-foreground">
          We use essential cookies to keep you signed in and remember your delivery location — no advertising or
          tracking cookies.{" "}
          <Link href="/cookies" className="font-medium text-foreground underline underline-offset-4">
            Cookie Policy
          </Link>
        </p>
        <Button size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
