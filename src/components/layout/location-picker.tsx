"use client";

import { ChevronDownIcon, CrosshairIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setLocationAction } from "@/actions/location";
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

export function LocationPicker({ location, className }: { location: GeoLocation; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [pincode, setPincode] = useState(location.pincode);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const save = (next: GeoLocation) => {
    startTransition(async () => {
      const result = await setLocationAction(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Delivering to ${next.label} · ${next.pincode}`);
      setOpen(false);
      setCoords(null);
    });
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        toast.info("Location detected — confirm your pincode to continue");
      },
      () => {
        setLocating(false);
        toast.error("We couldn't access your location. Pick a city instead.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const savePincode = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    save({
      label: coords ? "Current location" : location.label,
      lat: coords?.lat ?? location.lat,
      lon: coords?.lon ?? location.lon,
      pincode,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
            className,
          )}
          aria-label={`Delivery location: ${location.label}, ${location.pincode}. Change`}
        >
          <MapPinIcon className="size-4.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 leading-tight">
            <span className="block text-[0.68rem] font-medium text-muted-foreground">Deliver to</span>
            <span className="flex items-center gap-0.5 text-sm font-semibold">
              <span className="truncate">{location.label}</span>
              <span className="text-muted-foreground">· {location.pincode}</span>
              <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your delivery location</DialogTitle>
          <DialogDescription>
            Prices, stock and delivery times vary by location. We use this to fetch what&apos;s available near you.
          </DialogDescription>
        </DialogHeader>

        <Button variant="outline" size="lg" onClick={useCurrentLocation} disabled={locating || pending} className="w-full">
          {locating ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <CrosshairIcon data-icon="inline-start" />}
          {coords ? "Location detected" : "Use my current location"}
        </Button>

        <form onSubmit={savePincode} className="space-y-2">
          <Label htmlFor="pincode">Delivery pincode</Label>
          <div className="flex gap-2">
            <Input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 560034"
              className="h-9"
            />
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Required for DMart and JioMart availability.</p>
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Popular cities</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.label}
                type="button"
                disabled={pending}
                onClick={() => save(city)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-accent disabled:opacity-50",
                  city.label === location.label && "border-primary bg-accent font-semibold",
                )}
              >
                {city.label}
                <span className="block text-xs text-muted-foreground">{city.pincode}</span>
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
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
