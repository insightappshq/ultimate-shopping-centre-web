import { BadgePercentIcon, ClockIcon, LayersIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORM_LIST } from "@/config/platforms";

const POINTS = [
  { icon: LayersIcon, text: "One search across 7 shopping platforms" },
  { icon: BadgePercentIcon, text: "Best price, discount and value per unit highlighted" },
  { icon: ClockIcon, text: "Delivery times for your exact pincode" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
        <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-20 size-96 rounded-full bg-deal/25 blur-3xl" />
        <div className="relative self-start rounded-xl bg-card p-2 text-card-foreground">
          <Logo />
        </div>
        <div className="relative mt-auto max-w-md space-y-6">
          <h2 className="text-4xl leading-tight font-extrabold">Every platform. One cart. The best price.</h2>
          <ul className="space-y-3">
            {POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                  <point.icon className="size-4" aria-hidden />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-4">
            {PLATFORM_LIST.map((p) => (
              <PlatformLogo key={p.id} platform={p.id} size="lg" className="ring-2 ring-white/30" />
            ))}
          </div>
        </div>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
