import "server-only";
import { getCurrentUser } from "@/lib/auth/dal";
import { rethrowNextErrors } from "@/lib/errors";
import { getCartKeys } from "./cart";
import { getWishlistKeys } from "./wishlist";

export interface UserProductState {
  signedIn: boolean;
  savedKeys: Set<string>;
  cartKeys: Set<string>;
}

/** Which products the shopper already saved or has in cart, for card states. */
export async function getUserProductState(): Promise<UserProductState> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, savedKeys: new Set(), cartKeys: new Set() };
  try {
    const [saved, cart] = await Promise.all([getWishlistKeys(user.id), getCartKeys(user.id)]);
    return { signedIn: true, savedKeys: new Set(saved), cartKeys: new Set(cart) };
  } catch (error) {
    rethrowNextErrors(error);
    console.error("[user-product-state]", error);
    return { signedIn: true, savedKeys: new Set(), cartKeys: new Set() };
  }
}
