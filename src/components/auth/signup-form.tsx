"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendOtpAction, signUpAction, verifyOtpAction, type AuthChannel, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/format";
import { ChannelTabs, FieldError, IdentifierField, PasswordField } from "./fields";
import { OtpStep } from "./otp-step";

type FieldErrors = Partial<Record<"identifier" | "password" | "token" | "fullName", string>>;

export function SignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? undefined;
  const [channel, setChannel] = useState<AuthChannel>("email");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const finish = (result: AuthResult) => {
    if (!result.ok) {
      setErrors({ [result.field ?? "identifier"]: result.error });
      return;
    }
    if (result.needsVerification) {
      setVerifying(true);
      toast.success(channel === "email" ? "Check your inbox for a 6-digit code" : "We've sent you an SMS code");
      return;
    }
    toast.success("Account created — welcome to USC!");
    router.replace(result.redirectTo ?? "/");
    router.refresh();
  };

  if (verifying) {
    return (
      <OtpStep
        destination={channel === "email" ? identifier : formatPhone(`+91${identifier.replace(/\D/g, "")}`)}
        pending={pending}
        error={errors.token}
        onBack={() => setVerifying(false)}
        onResend={() => startTransition(async () => void (await sendOtpAction(channel, identifier)))}
        onVerify={(code) =>
          startTransition(async () => {
            setErrors({});
            finish(await verifyOtpAction(channel, identifier, code, next));
          })
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setErrors({});
            finish(await signUpAction(channel, identifier, password, fullName, next));
          });
        }}
      >
        <ChannelTabs
          value={channel}
          onChange={(value) => {
            setChannel(value);
            setIdentifier("");
            setErrors({});
          }}
        />
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            className="h-11"
          />
          <FieldError id="full-name-error" message={errors.fullName} />
        </div>
        <IdentifierField channel={channel} value={identifier} onChange={setIdentifier} error={errors.identifier} />
        <PasswordField
          label="Create password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters. We&apos;ll send a code to verify it&apos;s you.</p>
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
