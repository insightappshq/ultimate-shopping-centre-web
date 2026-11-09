export const siteConfig = {
  name: "Ultimate Shopping Centre",
  shortName: "USC",
  tagline: "Compare. Save. Shop smarter.",
  description:
    "Compare live prices across Blinkit, Zepto, Swiggy Instamart, BigBasket, JioMart, DMart and Amazon — and always check out at the best deal.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "support@usc.app",
} as const;

/**
 * Demo account seeded by `npm run db:seed`. Values can be overridden with the
 * NEXT_PUBLIC_DEMO_* variables so the login page always shows what was seeded.
 */
export const demoAccount = {
  enabled: process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== "false",
  email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@usc.app",
  phone: process.env.NEXT_PUBLIC_DEMO_PHONE ?? "+919000000001",
  password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "Demo@12345",
  /** Configure as a Supabase test OTP so phone OTP works without an SMS provider. */
  phoneOtp: process.env.NEXT_PUBLIC_DEMO_PHONE_OTP ?? "123456",
  fullName: "Demo Shopper",
} as const;

export const popularSearches = [
  "Amul butter",
  "Aashirvaad atta 5kg",
  "Milk",
  "Eggs",
  "Maggi",
  "Coca Cola",
  "Basmati rice",
  "Surf Excel",
] as const;

export const categories = [
  { label: "Dairy & Eggs", query: "milk", emoji: "🥛" },
  { label: "Fruits & Veggies", query: "fresh vegetables", emoji: "🥦" },
  { label: "Atta, Rice & Dal", query: "atta", emoji: "🌾" },
  { label: "Snacks", query: "chips", emoji: "🍿" },
  { label: "Beverages", query: "cold drink", emoji: "🥤" },
  { label: "Personal Care", query: "shampoo", emoji: "🧴" },
  { label: "Cleaning", query: "detergent", emoji: "🧼" },
  { label: "Baby Care", query: "diapers", emoji: "🍼" },
] as const;
