/**
 * Registry of the commerce platforms USC compares.
 *
 * `apiName` is the case-sensitive identifier the QuickCommerce API expects.
 * `id` is our own stable slug used in URLs and persisted in the database,
 * so platforms can be renamed upstream without migrating user data.
 */
export const PLATFORM_IDS = [
  "blinkit",
  "zepto",
  "instamart",
  "bigbasket",
  "jiomart",
  "dmart",
  "amazon",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export type PlatformKind = "quick" | "scheduled" | "marketplace";

export interface Platform {
  id: PlatformId;
  apiName: string;
  name: string;
  shortName: string;
  logo: string;
  /** Brand colour, used for accents next to the logo. */
  color: string;
  homepage: string;
  kind: PlatformKind;
  /** DMart, JioMart (and Flipkart Minutes) need a pincode on every call. */
  requiresPincode: boolean;
  /** Fallback delivery promise when the API does not return an SLA. */
  typicalEta: string;
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  blinkit: {
    id: "blinkit",
    apiName: "BlinkIt",
    name: "Blinkit",
    shortName: "Blinkit",
    logo: "/platforms/blinkit.png",
    color: "#F8CB46",
    homepage: "https://blinkit.com",
    kind: "quick",
    requiresPincode: false,
    typicalEta: "10 mins",
  },
  zepto: {
    id: "zepto",
    apiName: "Zepto",
    name: "Zepto",
    shortName: "Zepto",
    logo: "/platforms/zepto.png",
    color: "#5B1BB5",
    homepage: "https://www.zepto.com",
    kind: "quick",
    requiresPincode: false,
    typicalEta: "10 mins",
  },
  instamart: {
    id: "instamart",
    apiName: "Swiggy",
    name: "Swiggy Instamart",
    shortName: "Instamart",
    logo: "/platforms/swiggy.png",
    color: "#FC8019",
    homepage: "https://www.swiggy.com/instamart",
    kind: "quick",
    requiresPincode: false,
    typicalEta: "15 mins",
  },
  bigbasket: {
    id: "bigbasket",
    apiName: "BigBasket",
    name: "BigBasket",
    shortName: "BigBasket",
    logo: "/platforms/bigbasket.png",
    color: "#84C225",
    homepage: "https://www.bigbasket.com",
    kind: "quick",
    requiresPincode: false,
    typicalEta: "15 mins",
  },
  jiomart: {
    id: "jiomart",
    apiName: "JioMart",
    name: "JioMart",
    shortName: "JioMart",
    logo: "/platforms/jiomart.png",
    color: "#0078AD",
    homepage: "https://www.jiomart.com",
    kind: "scheduled",
    requiresPincode: true,
    typicalEta: "Same day",
  },
  dmart: {
    id: "dmart",
    apiName: "DMart",
    name: "DMart Ready",
    shortName: "DMart",
    logo: "/platforms/dmart.png",
    color: "#00843D",
    homepage: "https://www.dmart.in",
    kind: "scheduled",
    requiresPincode: true,
    typicalEta: "Next day",
  },
  amazon: {
    id: "amazon",
    apiName: "Amazon",
    name: "Amazon",
    shortName: "Amazon",
    logo: "/platforms/amazon.png",
    color: "#FF9900",
    homepage: "https://www.amazon.in",
    kind: "marketplace",
    requiresPincode: false,
    typicalEta: "1–2 days",
  },
};

export const PLATFORM_LIST: Platform[] = PLATFORM_IDS.map((id) => PLATFORMS[id]);

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === "string" && (PLATFORM_IDS as readonly string[]).includes(value);
}

export function getPlatform(id: PlatformId): Platform {
  return PLATFORMS[id];
}

const BY_API_NAME = new Map(PLATFORM_LIST.map((p) => [p.apiName.toLowerCase(), p]));

export function platformFromApiName(apiName: string | null | undefined): Platform | undefined {
  return apiName ? BY_API_NAME.get(apiName.toLowerCase()) : undefined;
}
