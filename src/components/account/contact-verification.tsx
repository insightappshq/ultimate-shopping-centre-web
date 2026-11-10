"use client";

import { CircleCheckIcon, Loader2Icon, LogOutIcon, MailIcon, SmartphoneIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { signOutAction } from "@/actions/auth";
import {
  completeMergeAction,
  confirmVerificationAction,
  startMergeAction,
  startVerificationAction,
  type ContactResult,
} from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authConfig, otpLengthFor } from "@/config/auth";
import type { ContactKind, ContactStatus } from "@/lib/auth/contact-types";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step =
  | { name: "entry" }
  | { name: "code"; value: string }
  | { name: "taken"; value: string; canMerge: boolean }
  | { name: "merge-code"; value: string };

const LABELS: Record<ContactKind, { title: string; icon: typeof MailIcon; placeholder: string }> = {
  email: { title: "Email address", icon: MailIcon, placeholder: "you@example.com" },
  phone: { title: "Mobile number", icon: SmartphoneIcon, placeholder: "98765 43210" },
};

const display = (kind: ContactKind, value: string) =>
  kind === "phone" ? formatPhone(value.startsWith("+") ? value : `+91${value.replace(/\D/g, "")}`) : value;

/**
 * Both sign-in identifiers on one account. Whichever the shopper signed in
 * with is already verified; the other is added and confirmed with a code. If
 * it belongs to another account, they can prove ownership and combine the two.
 */
export function ContactVerification({ status, next }: { status: ContactStatus; next?: string }) {
  const kinds: ContactKind[] = status.primary === "phone" ? ["phone", "email"] : ["email", "phone"];
  return (
    <div className="divide-y rounded-lg border bg-card">
      {kinds.map((kind) => (
        <ContactRow key={kind} kind={kind} status={status} next={next} />
      ))}
    </div>
  );
}

function ContactRow({ kind, status, next }: { kind: ContactKind; status: ContactStatus; next?: string }) {
  const router = useRouter();
  const verified = kind === "email" ? status.emailVerified : status.phoneVerified;
  const current = kind === "email" ? status.email : status.phone;
  const pending = kind === "email" ? status.pendingEmail : status.pendingPhone;
  const { title, icon: Icon, placeholder } = LABELS[kind];

  const [step, setStep] = useState<Step>({ name: "entry" });
  const [value, setValue] = useState(() =>
    pending ? (kind === "phone" ? pending.replace(/^\+91/, "") : pending) : "",
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, startTransition] = useTransition();
  const length = otpLengthFor(kind);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const run = (action: () => Promise<ContactResult>, onSuccess: (result: Extract<ContactResult, { ok: true }>) => void) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) {
        if (result.code === "exists") setStep({ name: "taken", value, canMerge: Boolean(result.canMerge) });
        else setError(result.error);
        return;
      }
      onSuccess(result);
    });

  const sendCode = () =>
    run(
      () => startVerificationAction(kind, value),
      () => {
        setStep({ name: "code", value });
        setCode("");
        setCooldown(authConfig.resendSeconds);
        toast.success(kind === "email" ? "Code sent. Check your inbox." : "Code sent by SMS");
      },
    );

  const confirm = (token: string) =>
    run(
      () => confirmVerificationAction(kind, value, token),
      () => {
        toast.success(kind === "email" ? "Email verified" : "Mobile number verified");
        setStep({ name: "entry" });
        router.refresh();
      },
    );

  const sendMergeCode = () =>
    run(
      () => startMergeAction(kind, value),
      () => {
        setStep({ name: "merge-code", value });
        setCode("");
        setCooldown(authConfig.resendSeconds);
        toast.success(`Code sent to ${display(kind, value)}`);
      },
    );

  const merge = (token: string) =>
    run(
      () => completeMergeAction(kind, value, token, next),
      (result) => {
        toast.success("Accounts combined. You're signed in to your existing account.", {
          description: result.notice,
          duration: result.notice ? 12000 : undefined,
        });
        router.replace(result.redirectTo ?? "/home");
        router.refresh();
      },
    );

  return (
    <section className="p-4" aria-label={title}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium">{title}</p>
            {verified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <CircleCheckIcon className="size-3.5" aria-hidden />
                Verified{status.primary === kind ? ", used to sign in" : ""}
              </span>
            ) : (
              <span className="text-xs font-medium text-warning">Not verified</span>
            )}
          </div>

          {verified && current ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{display(kind, current)}</p>
          ) : step.name === "entry" ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendCode();
              }}
            >
              <div className="relative min-w-0 flex-1">
                {kind === "phone" && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    +91
                  </span>
                )}
                <Input
                  type={kind === "email" ? "email" : "tel"}
                  inputMode={kind === "email" ? "email" : "numeric"}
                  autoComplete={kind === "email" ? "email" : "tel-national"}
                  aria-label={title}
                  placeholder={placeholder}
                  value={value}
                  onChange={(event) =>
                    setValue(kind === "phone" ? event.target.value.replace(/[^\d ]/g, "") : event.target.value)
                  }
                  className={cn(kind === "phone" && "pl-11 tabular")}
                />
              </div>
              <Button type="submit" variant="outline" size="lg" disabled={busy || !value.trim()}>
                {busy && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
                Send code
              </Button>
            </form>
          ) : step.name === "code" || step.name === "merge-code" ? (
            <CodeEntry
              length={length}
              code={code}
              onChange={setCode}
              busy={busy}
              cooldown={cooldown}
              prompt={
                step.name === "merge-code"
                  ? `Enter the code sent to ${display(kind, step.value)} to confirm it's your account.`
                  : `Enter the code sent to ${display(kind, step.value)}.`
              }
              submitLabel={step.name === "merge-code" ? "Verify and combine accounts" : "Verify"}
              onSubmit={(token) => (step.name === "merge-code" ? merge(token) : confirm(token))}
              onResend={step.name === "merge-code" ? sendMergeCode : sendCode}
              onChangeValue={() => setStep({ name: "entry" })}
            />
          ) : (
            <TakenNotice
              kind={kind}
              value={step.value}
              canMerge={step.canMerge}
              busy={busy}
              onMerge={sendMergeCode}
              onUseDifferent={() => {
                setStep({ name: "entry" });
                setValue("");
              }}
            />
          )}

          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive" role="alert">
              <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CodeEntry({
  length,
  code,
  onChange,
  busy,
  cooldown,
  prompt,
  submitLabel,
  onSubmit,
  onResend,
  onChangeValue,
}: {
  length: number;
  code: string;
  onChange: (code: string) => void;
  busy: boolean;
  cooldown: number;
  prompt: string;
  submitLabel: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeValue: () => void;
}) {
  return (
    <form
      className="mt-2 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(code);
      }}
    >
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <InputOTP
        maxLength={length}
        value={code}
        onChange={onChange}
        onComplete={onSubmit}
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Verification code"
      >
        <InputOTPGroup>
          {Array.from({ length }, (_, i) => (
            <InputOTPSlot key={i} index={i} className="size-10 text-base" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" size="lg" disabled={busy || code.length !== length}>
          {busy && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          {submitLabel}
        </Button>
        <span className="text-sm text-muted-foreground">
          {cooldown > 0 ? (
            <span className="tabular">Resend in {cooldown}s</span>
          ) : (
            <button type="button" className="font-medium text-primary hover:underline" onClick={onResend} disabled={busy}>
              Resend code
            </button>
          )}
        </span>
        <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={onChangeValue}>
          Change
        </button>
      </div>
    </form>
  );
}

function TakenNotice({
  kind,
  value,
  canMerge,
  busy,
  onMerge,
  onUseDifferent,
}: {
  kind: ContactKind;
  value: string;
  canMerge: boolean;
  busy: boolean;
  onMerge: () => void;
  onUseDifferent: () => void;
}) {
  const shown = display(kind, value);
  return (
    <div className="mt-2 space-y-3 rounded-md border border-warning/40 bg-warning-subtle p-3 text-sm">
      <p>
        <strong className="font-semibold">{shown}</strong> already has a USC account.
        {canMerge
          ? " If it's yours, confirm it with a code and we'll combine both into one account. Your cart, wishlist and searches are kept."
          : " If it's yours, sign in with it instead so your purchases stay in one account."}
      </p>
      <div className="flex flex-wrap gap-2">
        {canMerge ? (
          <Button size="lg" onClick={onMerge} disabled={busy}>
            {busy && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Send code to {shown}
          </Button>
        ) : (
          <form action={signOutAction}>
            <Button size="lg" type="submit">
              <LogOutIcon data-icon="inline-start" /> Sign in with {kind === "email" ? "that email" : "that number"}
            </Button>
          </form>
        )}
        <Button size="lg" variant="ghost" onClick={onUseDifferent}>
          Use a different {kind === "email" ? "email" : "number"}
        </Button>
      </div>
    </div>
  );
}
