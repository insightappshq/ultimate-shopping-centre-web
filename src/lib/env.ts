import "server-only";
import { z } from "zod";

/**
 * Server environment, validated lazily so `next build` works without secrets
 * and a missing variable fails loudly only in the feature that needs it.
 */
const serverSchema = z.object({
  QUICKCOMMERCE_API_KEY: z.string().optional(),
  QUICKCOMMERCE_API_BASE_URL: z.url().default("https://api.quickcommerceapi.com"),
  /** "true" forces mock data, "false" forces the live API, unset = mock when no key. */
  QUICKCOMMERCE_MOCK: z.enum(["true", "false"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("USC <onboarding@resend.dev>"),
  SUPABASE_AUTH_HOOK_SECRET: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  // `KEY=` in a .env file yields "", which should mean "not set", not "invalid".
  const defined = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined && value.trim() !== ""),
  );
  cached ??= serverSchema.parse(defined);
  return cached;
}

export function quickCommerceConfig() {
  const env = serverEnv();
  const useMock =
    env.QUICKCOMMERCE_MOCK === "true" ||
    (env.QUICKCOMMERCE_MOCK !== "false" && !env.QUICKCOMMERCE_API_KEY);
  return {
    apiKey: env.QUICKCOMMERCE_API_KEY,
    baseUrl: env.QUICKCOMMERCE_API_BASE_URL,
    useMock,
  };
}
