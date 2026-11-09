import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { legalConfig, siteConfig } from "@/config/site";

export type LegalDocument = "terms" | "cookies";

const TOKENS: Record<string, string> = {
  SITE_NAME: siteConfig.name,
  SITE_URL: siteConfig.url,
  SUPPORT_EMAIL: siteConfig.supportEmail,
  ENTITY_NAME: legalConfig.entityName,
  REGISTERED_ADDRESS: legalConfig.registeredAddress,
  JURISDICTION: legalConfig.jurisdiction,
  LEGAL_EMAIL: legalConfig.contactEmail,
  GRIEVANCE_OFFICER: legalConfig.grievanceOfficer,
  GRIEVANCE_EMAIL: legalConfig.grievanceEmail,
  LAST_UPDATED: legalConfig.lastUpdated,
};

/** Loads a policy from `content/legal/*.md` and fills `{{TOKENS}}` from config. */
export async function getLegalDocument(name: LegalDocument): Promise<string> {
  "use cache";
  cacheLife("max");
  const raw = await readFile(path.join(process.cwd(), "content", "legal", `${name}.md`), "utf8");
  return raw.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => TOKENS[key] ?? match);
}
