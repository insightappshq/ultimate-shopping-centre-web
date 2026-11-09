"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { clearSearchHistoryAction, updateNameAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateNameAction(name);
          if (result.ok) toast.success("Name updated");
          else toast.error(result.error);
        });
      }}
    >
      <Label htmlFor="full-name">Full name</Label>
      <div className="flex gap-2">
        <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} className="h-9" autoComplete="name" />
        <Button type="submit" size="lg" disabled={pending || name.trim() === initialName}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Save
        </Button>
      </div>
    </form>
  );
}

export function ClearHistoryButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await clearSearchHistoryAction();
          if (result.ok) toast.success("Search history cleared");
          else toast.error(result.error);
        })
      }
    >
      Clear
    </Button>
  );
}
