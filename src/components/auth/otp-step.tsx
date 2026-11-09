"use client";

import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { FieldError } from "./fields";

// Supabase allows one OTP request per user every 60 seconds.
const RESEND_SECONDS = 60;

export function OtpStep({
  destination,
  pending,
  error,
  onVerify,
  onResend,
  onBack,
}: {
  destination: string;
  pending: boolean;
  error?: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

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
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to <strong className="text-foreground">{destination}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          onComplete={onVerify}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="One-time code"
          aria-invalid={Boolean(error)}
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <FieldError id="otp-error" message={error} />
      </div>

      <Button type="submit" size="xl" className="w-full" disabled={pending || code.length !== 6}>
        {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
        Verify & continue
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get it?{" "}
        {seconds > 0 ? (
          <span className="tabular">Resend in {seconds}s</span>
        ) : (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setSeconds(RESEND_SECONDS);
              setCode("");
              onResend();
            }}
          >
            Resend code
          </button>
        )}
      </p>
    </form>
  );
}
