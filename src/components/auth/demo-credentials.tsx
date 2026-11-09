"use client";

import { CheckIcon, CopyIcon, FlaskConicalIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { demoAccount } from "@/config/site";
import { formatPhone } from "@/lib/format";

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1">
        <code className="truncate rounded bg-background px-1.5 py-0.5 font-mono text-xs">{value}</code>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={async () => {
            await navigator.clipboard.writeText(value).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5" />}
        </button>
      </dd>
    </div>
  );
}

export function DemoCredentials({
  onUseEmail,
  onUsePhone,
  pending,
}: {
  onUseEmail: () => void;
  onUsePhone: () => void;
  pending: boolean;
}) {
  if (!demoAccount.enabled) return null;
  return (
    <div className="rounded-2xl border border-dashed border-deal/60 bg-deal-subtle/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <FlaskConicalIcon className="size-4 text-deal" aria-hidden /> Demo account
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <CopyValue label="Email" value={demoAccount.email} />
        <CopyValue label="Mobile" value={formatPhone(demoAccount.phone)} />
        <CopyValue label="Password" value={demoAccount.password} />
        <CopyValue label="Mobile OTP" value={demoAccount.phoneOtp} />
      </dl>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="lg" variant="deal" onClick={onUseEmail} disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Sign in with email
        </Button>
        <Button size="lg" variant="outline" onClick={onUsePhone} disabled={pending}>
          Sign in with mobile
        </Button>
      </div>
    </div>
  );
}
