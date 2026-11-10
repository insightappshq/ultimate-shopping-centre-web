import {
  ArrowRightIcon,
  BadgePercentIcon,
  CalendarCheckIcon,
  CircleCheckIcon,
  CookieIcon,
  HeartIcon,
  LayersIcon,
  ListChecksIcon,
  LockKeyholeIcon,
  MapPinnedIcon,
  ReceiptIndianRupeeIcon,
  RouteIcon,
  ScaleIcon,
  SearchIcon,
  ShoppingBasketIcon,
  ShoppingCartIcon,
  TimerIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { ComparisonPreview } from "@/components/marketing/comparison-preview";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PLATFORM_LIST } from "@/config/platforms";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — Compare grocery prices across Blinkit, Zepto, Instamart & more` },
  description:
    "Compare live prices, stock and delivery times across Blinkit, Zepto, Swiggy Instamart, BigBasket, JioMart, DMart Ready and Amazon for your pincode. Search once, buy where it's cheapest.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <PlatformStrip />
      <Problem />
      <HowItWorks />
      <Features />
      <Audiences />
      <Trust />
      <Faq />
      <FinalCta />
    </>
  );
}

/* --------------------------------- Hero ---------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <h1 className="text-[2.6rem] leading-[1.02] text-balance sm:text-[3.4rem] lg:text-[4rem]">
            Every app, one search. Pay the lowest price.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            USC compares live prices, stock and delivery times across Blinkit, Zepto, Swiggy Instamart, BigBasket,
            JioMart, DMart Ready and Amazon for your exact pincode — so you stop switching between apps and start
            saving on every order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="xl">
              <Link href="/signup">
                Create your free account <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Free to use", "No payment details", "Pincode-accurate results"].map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <CircleCheckIcon className="size-4 text-success" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <ComparisonPreview className="mx-auto w-full max-w-md lg:max-w-none" />
      </div>
    </section>
  );
}

function PlatformStrip() {
  return (
    <section id="platforms" className="scroll-mt-20 border-y bg-card">
      <div className="container-page py-10">
        <p className="text-center text-xs font-semibold text-muted-foreground">
          Compare prices across the apps you already use
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {PLATFORM_LIST.map((platform) => (
            <li key={platform.id} className="flex items-center gap-2.5 text-sm font-semibold">
              <PlatformLogo platform={platform.id} size="lg" />
              {platform.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- Sections -------------------------------- */

function SectionIntro({ title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-[2rem] text-balance sm:text-[2.5rem]">{title}</h2>
      {body && <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{body}</p>}
    </div>
  );
}

const PROBLEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ReceiptIndianRupeeIcon,
    title: "Prices change by app and by area",
    body: "Each platform prices from its nearest store, so the same product can cost noticeably more on one app than another — and more in one neighbourhood than the next.",
  },
  {
    icon: ScaleIcon,
    title: "Offers hide the real cost",
    body: "A bigger discount isn't always a better deal. Different pack sizes make it hard to see which listing is actually cheaper per gram, litre or piece.",
  },
  {
    icon: TimerIcon,
    title: "Delivery promises vary widely",
    body: "Ten minutes, same day or tomorrow — knowing who can deliver what, and when, usually means opening every app one by one.",
  },
];

function Problem() {
  return (
    <section className="container-page py-16 sm:py-20">
      <SectionIntro
        eyebrow="Why USC"
        title="The same basket rarely costs the same twice"
        body="Quick-commerce and grocery platforms set their prices store by store and change them through the day. Finding the best deal means searching five apps and comparing in your head. USC does that work for you in seconds."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PROBLEMS.map((item) => (
          <div key={item.title} className="rounded-lg border bg-card p-6">
            <item.icon className="size-5 text-deal" aria-hidden />
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MapPinnedIcon,
    title: "Confirm your location",
    body: "We detect your pincode from your device, so every price and delivery time reflects what can actually reach your door.",
  },
  {
    icon: SearchIcon,
    title: "Search once",
    body: "Type what you need. USC queries every platform in parallel and brings the results back together in a few seconds.",
  },
  {
    icon: LayersIcon,
    title: "Compare like for like",
    body: "Identical products are matched across platforms — same brand, same pack size — so you compare prices, not guesses.",
  },
  {
    icon: ShoppingCartIcon,
    title: "Check out where it's cheapest",
    body: "Build one cart across platforms, then let guided checkout walk you through placing each order on the platform itself.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-card py-16 sm:py-20">
      <div className="container-page">
        <SectionIntro eyebrow="How it works" title="From search to savings in four steps" />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-lg border bg-background p-6">
              <span className="font-heading text-sm font-bold text-primary tabular">0{index + 1}</span>
              <step.icon className="mt-4 size-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MapPinnedIcon,
    title: "Live, location-aware prices",
    body: "Prices, stock and delivery estimates are fetched live for your pincode — not scraped yesterday, not averaged across a city.",
  },
  {
    icon: LayersIcon,
    title: "Smart product matching",
    body: "Platforms name products differently. USC recognises the same item across apps and keeps different pack sizes apart.",
  },
  {
    icon: BadgePercentIcon,
    title: "Best-deal insights",
    body: "Every product page highlights the lowest price, the fastest delivery, the best value per unit and the biggest discount.",
  },
  {
    icon: ShoppingBasketIcon,
    title: "One cart, every platform",
    body: "Add the best listing from any platform to a single cart, grouped by app with subtotals and savings at a glance.",
  },
  {
    icon: ListChecksIcon,
    title: "Guided checkout",
    body: "Step through your cart item by item: open each product on its platform, place the order there, and tick it off.",
  },
  {
    icon: HeartIcon,
    title: "Wishlist with price memory",
    body: "Save products for later. USC remembers the price you saw, so you can tell at a glance when it's worth buying.",
  },
];

function Features() {
  return (
    <section id="features" className="container-page scroll-mt-20 py-16 sm:py-20">
      <SectionIntro
        eyebrow="Features"
        title="Everything you need to shop smarter"
        body="Designed for the way India buys groceries and essentials today — across many apps, in minutes, on a budget."
      />
      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="bg-card p-6">
            <feature.icon className="size-5 text-primary" aria-hidden />
            <h3 className="mt-4 font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const AUDIENCES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: CalendarCheckIcon,
    title: "Monthly stock-ups",
    body: "Planning the big grocery run? Compare staples like atta, rice, oil and detergent where small per-unit differences add up fastest.",
  },
  {
    icon: RouteIcon,
    title: "Last-minute top-ups",
    body: "Need it in the next fifteen minutes? See which app can deliver to you right now, and what it will cost.",
  },
  {
    icon: UsersIcon,
    title: "Households on a budget",
    body: "Keep a shared view of what's cheapest this week, and build the habit of checking before you tap 'Buy'.",
  },
];

function Audiences() {
  return (
    <section className="bg-card py-16 sm:py-20">
      <div className="container-page">
        <SectionIntro eyebrow="Made for" title="However you shop, USC fits in" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((item) => (
            <div key={item.title} className="rounded-lg border bg-background p-6">
              <item.icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TRUST: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: WalletIcon,
    title: "We never take your money",
    body: "USC doesn't process payments or store card details. You always pay on the platform you choose, under its own protections.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Your data stays yours",
    body: "We use your account and pincode only to run comparisons and keep your cart and wishlist. We don't sell personal data.",
  },
  {
    icon: CookieIcon,
    title: "Essential cookies only",
    body: "No advertising trackers. Cookies keep you signed in and remember your delivery location — nothing more.",
  },
];

function Trust() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-[2rem] text-balance sm:text-[2.5rem]">Independent, transparent, on your side</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            USC isn&apos;t owned by any of the platforms it compares, and rankings are never paid for. The cheapest
            listing is shown as the cheapest — whoever sells it.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Read our{" "}
            <Link href="/terms" className="font-medium text-foreground underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/cookies" className="font-medium text-foreground underline underline-offset-4">
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="grid gap-4">
          {TRUST.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg border bg-card p-5">
              <item.icon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is USC free to use?",
    a: "Yes. Creating an account and comparing prices is free. You pay only for what you buy, directly on the platform you order from.",
  },
  {
    q: "Do I place orders or pay on USC?",
    a: "No. USC shows you where each product is cheapest and helps you build a cart. When you're ready, guided checkout opens each product on its platform's own website or app, where you complete the order and payment as usual.",
  },
  {
    q: "How accurate are the prices?",
    a: "Prices, stock and delivery estimates are fetched live from each platform for your pincode and refreshed every few minutes. Platforms can change prices at any time, so the final amount is always the one shown at checkout on the platform.",
  },
  {
    q: "Why do I need an account?",
    a: "Your account keeps your delivery location, cart, wishlist and search history in one place across devices, and lets us show results for the pincode you actually shop from.",
  },
  {
    q: "How do you use my location?",
    a: "With your permission, we read your device location once to find your pincode. We store the pincode and approximate coordinates to fetch local prices — never your continuous location — and you can change it any time.",
  },
  {
    q: "Which cities does USC work in?",
    a: "USC works for any Indian pincode. Which platforms appear depends on who delivers to your area — quick-commerce apps cover most major cities, while JioMart, DMart Ready and Amazon reach many more pincodes.",
  },
  {
    q: "Can I compare different pack sizes?",
    a: "Yes. Matching keeps different pack sizes separate so comparisons stay fair, and every listing shows its price per 100 g, 100 ml or piece so you can spot the best value at a glance.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-card py-16 sm:py-20">
      <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionIntro title="Questions, answered" body="Everything you need to know before your first comparison." />
        <Accordion type="single" collapsible className="rounded-lg border bg-card px-5">
          {FAQS.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`}>
              <AccordionTrigger className="py-5 text-base font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-lg bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-[2rem] text-balance sm:text-[2.5rem]">Your next order could cost less. Find out in seconds.</h2>
            <p className="mt-3 text-lg text-primary-foreground/80">
              Create a free account, confirm your pincode, and run your first comparison in under a minute.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="xl" className="bg-white text-primary hover:bg-white/90">
              <Link href="/signup">
                Get started free <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="secondary">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
