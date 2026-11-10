"use client";

import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  sendPasswordResetCodeAction,
  setPasswordAction,
  verifyOtpAction,
  type AuthChannel,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { otpLengthFor, type OtpDelivery } from "@/config/auth";
import { formatPhone } from "@/lib/format";
import { ChannelTabs, IdentifierField, PasswordField } from "./fields";
import { OtpStep } from "./otp-step";

type Step = "identify" | "verify" | "password";

/**
 * Forgot or set a password: prove ownership of the email/mobile with a
 * one-time code (which signs the shopper in), then choose a new password.
 * Also how code-only accounts add a password for the first time.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? undefined;

  const [step, setStep] = useState<Step>("identify");
  const [channel, setChannel] = useState<AuthChannel>(params.get("channel") === "phone" ? "phone" : "email");
  const [identifier, setIdentifier] = useState(params.get("identifier") ?? "");
  const [delivery, setDelivery] = useState<OtpDelivery>("sms");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; token?: string; password?: string }>({});
  const [noAccount, setNoAccount] = useState(false);
  const [pending, startTransition] = useTransition();

  const destination = channel === "email" ? identifier : formatPhone(`+91${identifier.replace(/\D/g, "")}`);

  const sendCode = (via: OtpDelivery = "sms") =>
    startTransition(async () => {
      setErrors({});
      setNoAccount(false);
      const result = await sendPasswordResetCodeAction(channel, identifier, via);
      if (!result.ok) {
        if (step === "verify") toast.error(result.error);
        else setErrors({ identifier: result.error });
        setNoAccount(result.code === "no_account");
        return;
      }
      setDelivery(via);
      setStep("verify");
      toast.success(channel === "email" ? "Code sent. Check your inbox." : "Code sent by SMS");
    });

  if (step === "verify") {
    return (
      <OtpStep
        destination={destination}
        notice="Enter the code to confirm it's you. You'll choose a new password next."
        length={otpLengthFor(channel)}
        delivery={channel === "phone" ? delivery : undefined}
        pending={pending}
        error={errors.token}
        onBack={() => setStep("identify")}
        onResend={(via) => sendCode(via ?? delivery)}
        onVerify={(code) =>
          startTransition(async () => {
            setErrors({});
            const result = await verifyOtpAction(channel, identifier, code, next);
            if (!result.ok) {
              setErrors({ token: result.error });
              return;
            }
            setStep("password");
          })
        }
      />
    );
  }

  if (step === "password") {
    return (
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setErrors({});
            const result = await setPasswordAction(password, confirm, next);
            if (!result.ok) {
              setErrors({ password: result.error });
              return;
            }
            toast.success("Password saved. You can now sign in with it.");
            router.replace(result.redirectTo ?? "/home");
            router.refresh();
          });
        }}
      >
        <p className="flex items-center gap-2 rounded-md border border-success/30 bg-success-subtle px-3 py-2.5 text-sm" role="status">
          <CircleCheckIcon className="size-4 shrink-0 text-success" aria-hidden />
          Verified {destination}. Choose a new password.
        </p>
        <PasswordField label="New password" autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          error={errors.password}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Save password
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          sendCode("sms");
        }}
      >
        <ChannelTabs
          value={channel}
          onChange={(value) => {
            setChannel(value);
            setIdentifier("");
            setErrors({});
            setNoAccount(false);
          }}
        />
        <IdentifierField channel={channel} value={identifier} onChange={setIdentifier} error={errors.identifier} />
        {noAccount && (
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/signup?${new URLSearchParams({ channel, identifier, ...(next ? { next } : {}) })}`}>
              Create an account instead
            </Link>
          </Button>
        )}
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Send code {channel === "email" ? "by email" : "by SMS"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
