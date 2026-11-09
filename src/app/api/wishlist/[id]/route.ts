import { fail, handleApiError, ok } from "@/lib/api";
import { requireUserForMutation } from "@/lib/auth/dal";
import { removeWishlistItem } from "@/lib/data/wishlist";

/** DELETE /api/wishlist/:id */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/wishlist/[id]">) {
  try {
    const user = await requireUserForMutation();
    const { id } = await ctx.params;
    const { count } = await removeWishlistItem(user.id, id);
    if (!count) return fail(404, "not_found", "Wishlist item not found");
    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
