import { connection } from "next/server";
import { db } from "@/lib/db";
import { quickCommerceConfig } from "@/lib/env";

/** GET /api/health — liveness plus dependency checks for monitoring. */
export async function GET() {
  await connection();
  const started = Date.now();
  const database = await db.$queryRaw`SELECT 1`
    .then(() => "ok" as const)
    .catch(() => "error" as const);

  const status = database === "ok" ? 200 : 503;
  return Response.json(
    {
      status: status === 200 ? "ok" : "degraded",
      checks: {
        database,
        quickcommerce: quickCommerceConfig().useMock ? "mock" : "live",
      },
      latencyMs: Date.now() - started,
    },
    { status },
  );
}
