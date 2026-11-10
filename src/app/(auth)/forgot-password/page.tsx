import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Reset your password</h1>
        <p className="mt-1.5 text-muted-foreground">
          We&apos;ll send a one-time code to confirm it&apos;s you. This also works if you&apos;ve never set a password.
        </p>
      </div>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
