"use client";

import { ChevronDownIcon, Loader2Icon, LocateFixedIcon, MapPinIcon, SearchIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { applyDeviceLocationAction, setLocationAction, setPincodeAction } from "@/actions/location";
import { useDeviceLocation } from "@/components/location/use-device-location";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITY_PRESETS } from "@/lib/location";
import type { GeoLocation } from "@/lib/quickcommerce/types";
import { cn } from "@/lib/utils";

/** Header trigger: "Deliver to" over "Area, City · 400030" — the pincode never wraps or truncates. */
function LocationSummary({ location }: { location: GeoLocation }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <MapPinIcon className="size-4.5 shrink-0 text-primary" aria-hidden />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[0.68rem] font-medium text-muted-foreground">Deliver to</span>
        <span className="flex min-w-0 items-center gap-1 text-sm">
          <span className="truncate font-semibold">{location.label}</span>
          <span className="shrink-0 font-semibold whitespace-nowrap text-muted-foreground tabular">
            {location.pincode}
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </span>
      </span>
    </span>
  );
}

export function LocationPicker({ location, className }: { location: GeoLocation; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pincode, setPincode] = useState(location.pincode);
  const device = useDeviceLocation(applyDeviceLocationAction);
  const pincodeId = useId();

  const done = (next: GeoLocation) => {
    toast.success(`Delivering to ${next.label} · ${next.pincode}`);
    setPincode(next.pincode);
    setOpen(false);
  };

  const detect = async () => {
    const result = await device.locate();
    if (!result) return;
    if (result.ok) done(result.data);
    else toast.error(result.error);
  };

  const applyPincode = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    startTransition(async () => {
      const result = await setPincodeAction(pincode);
      if (result.ok) done(result.data);
      else toast.error(result.error);
    });
  };

  const chooseCity = (city: GeoLocation) =>
    startTransition(async () => {
      const result = await setLocationAction(city);
      if (result.ok) done(city);
      else toast.error(result.error);
    });

  const busy = pending || device.busy;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 items-center rounded-lg px-2 py-1.5 text-left transition hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
            className,
          )}
          aria-label={`Delivery location: ${location.label}, pincode ${location.pincode}. Change`}
        >
          <LocationSummary location={location} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery location</DialogTitle>
          <DialogDescription>
            Prices, stock and delivery times depend on where you are. We use your pincode to check what each platform
            can deliver to you.
          </DialogDescription>
        </DialogHeader>

        <Button size="xl" onClick={detect} disabled={busy} className="w-full">
          {device.busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <LocateFixedIcon data-icon="inline-start" />}
          {device.status === "locating"
            ? "Finding your location…"
            : device.status === "resolving"
              ? "Looking up your pincode…"
              : "Use my current location"}
        </Button>
        {device.error && <p className="-mt-2 text-xs text-destructive">{device.error}</p>}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or enter a pincode <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={applyPincode} className="space-y-1.5">
          <Label htmlFor={pincodeId} className="sr-only">
            Pincode
          </Label>
          <div className="flex gap-2">
            <Input
              id={pincodeId}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={pincode}
              onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit pincode"
              className="h-11 tabular"
            />
            <Button type="submit" size="xl" variant="outline" disabled={busy}>
              {pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
              Apply
            </Button>
          </div>
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Popular cities</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.label}
                type="button"
                disabled={busy}
                onClick={() => chooseCity(city)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-accent disabled:opacity-50",
                  city.pincode === location.pincode && "border-primary bg-accent font-semibold",
                )}
              >
                {city.label}
                <span className="block text-xs text-muted-foreground tabular">{city.pincode}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LocationPickerFallback() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <MapPinIcon className="size-4.5 text-primary" aria-hidden />
      <div className="space-y-1">
        <div className="h-2 w-12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
