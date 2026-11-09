"use client";

import { EyeIcon, EyeOffIcon, MailIcon, SmartphoneIcon } from "lucide-react";
import { useState } from "react";
import type { AuthChannel } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function ChannelTabs({ value, onChange }: { value: AuthChannel; onChange: (value: AuthChannel) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as AuthChannel)}>
      <TabsList className="grid h-10 w-full grid-cols-2">
        <TabsTrigger value="email" className="gap-1.5">
          <MailIcon className="size-4" /> Email
        </TabsTrigger>
        <TabsTrigger value="phone" className="gap-1.5">
          <SmartphoneIcon className="size-4" /> Mobile
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive" role="alert">
      {message}
    </p>
  );
}

export function IdentifierField({
  channel,
  value,
  onChange,
  error,
  autoFocus,
}: {
  channel: AuthChannel;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}) {
  const id = `identifier-${channel}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{channel === "email" ? "Email address" : "Mobile number"}</Label>
      {channel === "email" ? (
        <Input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoFocus={autoFocus}
          className="h-11"
        />
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            +91
          </span>
          <Input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={11}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d ]/g, ""))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            autoFocus={autoFocus}
            className="h-11 pl-12 tabular"
          />
        </div>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function PasswordField({
  value,
  onChange,
  error,
  autoComplete = "current-password",
  label = "Password",
  action,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  label?: string;
  action?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">{label}</Label>
        {action}
      </div>
      <div className="relative">
        <Input
          id="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "password-error" : undefined}
          className="h-11 pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn("absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted")}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
      <FieldError id="password-error" message={error} />
    </div>
  );
}
