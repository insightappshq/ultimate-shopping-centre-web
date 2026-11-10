"use client";

import { ArrowLeftIcon, Loader2Icon, MessageCircleIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authConfig, type OtpDelivery } from "@/config/auth";
import { FieldError } from "./fields";

export function OtpStep({
  destination,
  notice,
  length = 6,
  delivery,
  pending,
  error,
  onVerify,
  onResend,
  onBack,
}: {
  destination: string;
  /** Context shown above the prompt, e.g. "You already have an account…". */
  notice?: string;
  /** Digits in the code: 6 for email; the Twilio Verify service's length for phone. */
  length?: number;
  /** Set for phone codes: how the last code was sent, enabling "send via WhatsApp/SMS instead". */
  delivery?: OtpDelivery;
  pending: boolean;
  error?: string;
  onVerify: (code: string) => void;
  onResend: (delivery?: OtpDelivery) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const errorId = useId();
  const [seconds, setSeconds] = useState<number>(authConfig.resendSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const resend = (via?: OtpDelivery) => {
    setSeconds(authConfig.resendSeconds);
    setCode("");
    onResend(via);
  };

  const alternate: OtpDelivery | null =
    delivery && authConfig.whatsappOtp ? (delivery === "sms" ? "whatsapp" : "sms") : null;
  const sentVia = delivery === "whatsapp" ? "on WhatsApp to" : delivery === "sms" ? "by SMS to" : "to";

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onVerify(code);
      }}
    >
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Change
        </button>
        {notice && (
          <p className="mb-3 rounded-md border border-primary/20 bg-secondary px-3 py-2.5 text-sm text-secondary-foreground" role="status">
            {notice}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Enter the {length}-digit code sent {sentVia} <strong className="whitespace-nowrap text-foreground">{destination}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <InputOTP
          maxLength={length}
          value={code}
          onChange={setCode}
          onComplete={onVerify}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="One-time code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            {Array.from({ length }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-11 text-lg sm:size-12" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <FieldError id={errorId} message={error} />
      </div>

      <Button type="submit" size="xl" className="w-full" disabled={pending || code.length !== length}>
        {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
        Verify and continue
      </Button>

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Didn&apos;t get it?{" "}
          {seconds > 0 ? (
            <span className="tabular">Resend in {seconds}s</span>
          ) : (
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => resend(delivery)}>
              Resend code
            </button>
          )}
        </p>
        {alternate && seconds <= 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            onClick={() => resend(alternate)}
          >
            <MessageCircleIcon className="size-4" aria-hidden />
            {alternate === "whatsapp" ? "Send the code on WhatsApp instead" : "Send the code by SMS instead"}
          </button>
        )}
      </div>
    </form>
  );
}
