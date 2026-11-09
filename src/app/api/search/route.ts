import type { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api";
import { requireUserForMutation } from "@/lib/auth/dal";
import { getLocation } from "@/lib/location.server";
import { buildFacets, parseSearchParams, shapeResults } from "@/lib/quickcommerce/filters";
import { searchProducts } from "@/lib/quickcommerce/service";

/**
 * GET /api/search?q=milk&platforms=blinkit,zepto&sort=price_asc&inStock=1
 * Same filters as the /search page. Location comes from the location cookie.
 */
export async function GET(request: NextRequest) {
  try {
    await requireUserForMutation();
    const filters = parseSearchParams(Object.fromEntries(request.nextUrl.searchParams));
    if (!filters.q) return fail(422, "invalid_request", "Query parameter `q` is required");

    const location = await getLocation();
    const result = await searchProducts(filters.q, filters.platforms, location);
    const shaped = shapeResults(result.offers, filters);

    return ok({
      query: result.query,
      location,
      statuses: result.statuses,
      facets: buildFacets(result.offers),
      ...shaped,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
