"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { clearOrderedItemsAction } from "@/actions/cart";
import { Button } from "@/components/ui/button";

export function ClearOrderedButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  if (!count) return null;
  return (
    <Button
      variant="ghost"
      size="lg"
      className="w-full text-muted-foreground"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await clearOrderedItemsAction();
          if (result.ok) toast.success("Cleared purchased items");
          else toast.error(result.error);
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
      Clear {count} purchased {count === 1 ? "item" : "items"}
    </Button>
  );
}
