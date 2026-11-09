"use client";

import {
  ArrowRightIcon,
  CircleCheckIcon,
  Loader2Icon,
  LocateFixedIcon,
  MapPinIcon,
  PencilIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { resolveCoordinatesAction, resolvePincodeAction } from "@/actions/location";
import { completeOnboardingAction } from "@/actions/profile";
import { FieldError } from "@/components/auth/fields";
import { useDeviceLocation } from "@/components/location/use-device-location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GeoLocation } from "@/lib/quickcommerce/types";
import { cn } from "@/lib/utils";

type Source = "device" | "pincode" | "saved";

export function OnboardingForm({
  initialName,
  initialLocation,
  identity,
  next,
}: {
  initialName: string;
  initialLocation: GeoLocation | null;
  identity: string;
  next?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [location, setLocation] = useState<GeoLocation | null>(initialLocation);
  const [source, setSource] = useState<Source | null>(initialLocation ? "saved" : null);
  const [pincode, setPincode] = useState(initialLocation?.pincode ?? "");
  const [editing, setEditing] = useState(!initialLocation);
  const [errors, setErrors] = useState<{ fullName?: string; pincode?: string }>({});
  const [lookingUp, startLookup] = useTransition();
  const [saving, startSaving] = useTransition();
  const device = useDeviceLocation(resolveCoordinatesAction);
  const attempted = useRef(false);

  const detect = async () => {
    const result = await device.locate();
    if (!result) return;
    if (!result.ok) {
      setErrors({ pincode: result.error });
      setEditing(true);
      return;
    }
    setLocation(result.data);
    setPincode(result.data.pincode);
    setSource("device");
    setEditing(false);
    setErrors({});
  };

  // The whole point of this step is the delivery location, so start detecting
  // straight away unless we already have a saved one to confirm.
  useEffect(() => {
    if (attempted.current || initialLocation) return;
    attempted.current = true;
    void detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookUpPincode = () => {
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setErrors({ pincode: "Enter a valid 6-digit pincode" });
      return;
    }
    startLookup(async () => {
      const result = await resolvePincodeAction(pincode);
      if (!result.ok) {
        setErrors({ pincode: result.error });
        return;
      }
      setLocation(result.data);
      setSource("pincode");
      setEditing(false);
      setErrors({});
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      setErrors({ fullName: "Enter your full name" });
      return;
    }
    if (!location || editing) {
      setErrors({ pincode: editing ? "Confirm your pincode to continue" : "Add your delivery pincode" });
      return;
    }
    startSaving(async () => {
      const result = await completeOnboardingAction({ fullName, location, next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`You're all set, ${fullName.trim().split(/\s+/)[0]}!`);
      router.replace(result.data.redirectTo);
      router.refresh();
    });
  };

  const detecting = device.busy;

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="full-name">Full name</Label>
        <Input
          id="full-name"
          autoComplete="name"
          autoFocus={!initialName}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "full-name-error" : "full-name-hint"}
          className="h-11"
          placeholder="e.g. Priya Sharma"
        />
        <FieldError id="full-name-error" message={errors.fullName} />
        {!errors.fullName && (
          <p id="full-name-hint" className="text-xs text-muted-foreground">
            Signed in as {identity}
          </p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Delivery location</legend>
        <p className="text-xs text-muted-foreground">
          Platforms price and stock products by pincode, so we use yours to show what can actually be delivered to you.
        </p>

        {detecting ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-secondary/50 p-4 text-sm" role="status">
            <Loader2Icon className="size-5 animate-spin text-primary" aria-hidden />
            {device.status === "locating" ? "Detecting your location…" : "Finding your pincode…"}
          </div>
        ) : location && !editing ? (
          <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-subtle/60 p-4">
            <MapPinIcon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                <span className="font-heading text-lg tabular">{location.pincode}</span>
                <span className="truncate text-sm font-medium text-muted-foreground">{location.label}</span>
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-success">
                <CircleCheckIcon className="size-3.5" aria-hidden />
                {source === "device" ? "Detected from your location" : source === "pincode" ? "Pincode confirmed" : "Saved location"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <PencilIcon data-icon="inline-start" /> Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="pincode" className="sr-only">
              Pincode
            </Label>
            <div className="flex gap-2">
              <Input
                id="pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={pincode}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    lookUpPincode();
                  }
                }}
                aria-invalid={Boolean(errors.pincode)}
                placeholder="6-digit pincode"
                className="h-11 tabular"
              />
              <Button type="button" size="xl" variant="outline" onClick={lookUpPincode} disabled={lookingUp}>
                {lookingUp && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
                Confirm
              </Button>
            </div>
          </div>
        )}

        {errors.pincode && (
          <p className="flex items-start gap-1.5 text-xs font-medium text-destructive" role="alert">
            <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
            {errors.pincode}
          </p>
        )}

        {!detecting && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={detect}
            className={cn("h-auto px-0", source === "device" && !editing && "hidden")}
          >
            <LocateFixedIcon data-icon="inline-start" /> Use my current location
          </Button>
        )}
      </fieldset>

      <Button type="submit" size="xl" className="w-full" disabled={saving || detecting || lookingUp}>
        {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}
        Continue to USC
        {!saving && <ArrowRightIcon data-icon="inline-end" />}
      </Button>
    </form>
  );
}
