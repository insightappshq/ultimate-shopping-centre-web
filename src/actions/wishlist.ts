"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import { addCartItem } from "@/lib/data/cart";
import { productSnapshotSchema, type ProductSnapshot } from "@/lib/data/schemas";
import {
  addWishlistItem,
  findWishlistItem,
  removeWishlistItem,
  removeWishlistProduct,
} from "@/lib/data/wishlist";
import { toActionError, type ActionResult } from "./result";

const idSchema = z.string().min(1).max(64);

/** Adds the product, or removes it if already saved. Returns the new state. */
export async function toggleWishlistAction(
  product: ProductSnapshot,
  save: boolean,
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const user = await requireUserForMutation();
    const snapshot = productSnapshotSchema.parse(product);
    if (save) {
      await ensureProfile(user);
      await addWishlistItem(user.id, snapshot);
    } else {
      await removeWishlistProduct(user.id, snapshot.platform, snapshot.productId);
    }
    refresh();
    return { ok: true, data: { saved: save } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeWishlistItemAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    await removeWishlistItem(user.id, idSchema.parse(itemId));
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveWishlistItemToCartAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    const item = await findWishlistItem(user.id, idSchema.parse(itemId));
    if (!item) return { ok: false, error: "Item not found", code: "invalid" };
    await addCartItem(user.id, {
      platform: item.platform,
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      image: item.image,
      quantity: item.packSize,
      price: item.price,
      mrp: item.mrp,
      deeplink: item.deeplink,
    });
    await removeWishlistItem(user.id, item.id);
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
