"use client";

import { AlertCircleIcon, KeyRoundIcon, Loader2Icon, MessageCircleIcon, MessageSquareTextIcon } from "lucide-react";
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
import { authConfig, otpLengthFor, type OtpDelivery } from "@/config/auth";
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
  const [delivery, setDelivery] = useState<OtpDelivery>("sms");
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
    // Phone sign-in is code-first (Twilio Verify); email keeps password as default.
    setMethod(value === "phone" ? "otp" : "password");
    setIdentifier("");
    setOtpSentTo(null);
    setErrors({});
  };

  const sendCode = (target = identifier, via: OtpDelivery = "sms") =>
    startTransition(async () => {
      setErrors({});
      const result = await sendOtpAction(channel, target, via);
      if (!result.ok) {
        // On the code screen there's no number field, so surface resend failures as a toast.
        if (otpSentTo) toast.error(result.error);
        else setErrors({ identifier: result.error });
        return;
      }
      setOtpSentTo(target);
      setDelivery(via);
      toast.success(
        channel === "email" ? "Code sent. Check your inbox." : via === "whatsapp" ? "Code sent on WhatsApp" : "Code sent by SMS",
      );
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
        length={otpLengthFor(channel)}
        delivery={channel === "phone" ? delivery : undefined}
        pending={pending}
        error={errors.token}
        onBack={() => setOtpSentTo(null)}
        onResend={(via) => sendCode(otpSentTo, via ?? delivery)}
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
        {method === "otp" && channel === "phone" && authConfig.whatsappOtp && (
          <Button type="button" variant="outline" size="xl" className="w-full" disabled={pending} onClick={() => sendCode(identifier, "whatsapp")}>
            <MessageCircleIcon data-icon="inline-start" />
            Send code on WhatsApp
          </Button>
        )}
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
