export const siteConfig = {
  name: "Ultimate Shopping Centre",
  shortName: "USC",
  tagline: "Compare. Save. Shop smarter.",
  description:
    "Compare live prices across Blinkit, Zepto, Swiggy Instamart, BigBasket, JioMart, DMart and Amazon — and always check out at the best deal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: "support@usc.app",
} as const;

/**
 * Details used in the Terms and Cookie Policy. Replace these with your
 * registered entity details before going live (see README → Legal pages).
 */
export const legalConfig = {
  entityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "Ultimate Shopping Centre",
  registeredAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "India",
  jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION || "the courts of India",
  contactEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL || "legal@usc.app",
  grievanceOfficer: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || "Grievance Officer",
  grievanceEmail: process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || "grievance@usc.app",
  lastUpdated: "10 November 2026",
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
