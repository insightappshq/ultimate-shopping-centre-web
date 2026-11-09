import type { NextRequest } from "next/server";
import { isPlatformId } from "@/config/platforms";
import { fail, handleApiError, ok } from "@/lib/api";
import { getLocation } from "@/lib/location.server";
import { compareProduct, getProduct } from "@/lib/quickcommerce/service";

/**
 * GET /api/products/:platform/:id?compare=1&q=<original search>
 * Product details from the platform, optionally with cross-platform prices.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/products/[platform]/[id]">) {
  try {
    const { platform, id } = await ctx.params;
    if (!isPlatformId(platform)) return fail(404, "unknown_platform", `Unknown platform "${platform}"`);

    const location = await getLocation();
    const product = await getProduct(platform, decodeURIComponent(id), location);
    if (!product) return fail(404, "not_found", "Product not found at this location");

    const params = request.nextUrl.searchParams;
    const comparison =
      params.get("compare") === "1"
        ? await compareProduct(product, location, { searchQuery: params.get("q") ?? undefined })
        : undefined;

    return ok({ product, comparison });
  } catch (error) {
    return handleApiError(error);
  }
}
