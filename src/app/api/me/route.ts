import { handleApiError, ok } from "@/lib/api";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCartCount } from "@/lib/data/cart";
import { getWishlistCount } from "@/lib/data/wishlist";

/** GET /api/me — the current session (null when signed out) with badge counts. */
export async function GET() {
  await connection();
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null });
    const [cartCount, wishlistCount] = await Promise.all([
      getCartCount(user.id),
      getWishlistCount(user.id),
    ]);
    return ok({ user, cartCount, wishlistCount });
  } catch (error) {
    return handleApiError(error);
  }
}
