"use client";

import { AlertCircleIcon, KeyRoundIcon, Loader2Icon, MessageSquareTextIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  sendOtpAction,
  signInWithPasswordAction,
  verifyOtpAction,
  type AuthChannel,
  type AuthResult,
} from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatPhone } from "@/lib/format";
import { ChannelTabs, IdentifierField, LegalConsent, PasswordField } from "./fields";
import { OtpStep } from "./otp-step";

type Method = "password" | "otp";
type FieldErrors = Partial<Record<"identifier" | "password" | "token", string>>;

const URL_ERRORS: Record<string, string> = {
  link_expired: "That sign-in link is invalid or has expired. Request a new code below.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? undefined;
  const urlError = URL_ERRORS[params.get("error") ?? ""];

  const [channel, setChannel] = useState<AuthChannel>("email");
  const [method, setMethod] = useState<Method>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const finish = (result: AuthResult) => {
    if (!result.ok) {
      setErrors({ [result.field ?? "identifier"]: result.error });
      return false;
    }
    toast.success("Welcome to USC");
    router.replace(result.redirectTo ?? "/");
    router.refresh();
    return true;
  };

  const switchChannel = (value: AuthChannel) => {
    setChannel(value);
    setIdentifier("");
    setOtpSentTo(null);
    setErrors({});
  };

  const sendCode = (target = identifier) =>
    startTransition(async () => {
      setErrors({});
      const result = await sendOtpAction(channel, target);
      if (!result.ok) {
        setErrors({ identifier: result.error });
        return;
      }
      setOtpSentTo(target);
      toast.success(channel === "email" ? "Code sent — check your inbox" : "Code sent by SMS");
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (method === "otp") return sendCode();
    startTransition(async () => {
      setErrors({});
      finish(await signInWithPasswordAction(channel, identifier, password, next));
    });
  };

  if (otpSentTo) {
    return (
      <OtpStep
        destination={channel === "email" ? otpSentTo : formatPhone(`+91${otpSentTo.replace(/\D/g, "")}`)}
        pending={pending}
        error={errors.token}
        onBack={() => setOtpSentTo(null)}
        onResend={() => sendCode(otpSentTo)}
        onVerify={(code) =>
          startTransition(async () => {
            setErrors({});
            finish(await verifyOtpAction(channel, otpSentTo, code, next));
          })
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {urlError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{urlError}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={submit} noValidate>
        <ChannelTabs value={channel} onChange={switchChannel} />

        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={method}
          onValueChange={(value) => value && (setMethod(value as Method), setErrors({}))}
          className="grid w-full grid-cols-2"
          aria-label="Sign-in method"
        >
          <ToggleGroupItem value="password" className="h-9 gap-1.5">
            <KeyRoundIcon className="size-4" /> Password
          </ToggleGroupItem>
          <ToggleGroupItem value="otp" className="h-9 gap-1.5">
            <MessageSquareTextIcon className="size-4" /> One-time code
          </ToggleGroupItem>
        </ToggleGroup>

        <IdentifierField
          channel={channel}
          value={identifier}
          onChange={setIdentifier}
          error={errors.identifier}
        />

        {method === "password" && (
          <PasswordField value={password} onChange={setPassword} error={errors.password} />
        )}

        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          {method === "password" ? "Sign in" : `Send code ${channel === "email" ? "by email" : "by SMS"}`}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to USC?{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>

      <LegalConsent />
    </div>
  );
}
