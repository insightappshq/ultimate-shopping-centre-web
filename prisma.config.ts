import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations should use a direct (non-pooled) connection when one is provided,
// e.g. Supabase's session-mode URL on port 5432.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
