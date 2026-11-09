"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import {
  addCartItem,
  clearOrderedItems,
  findCartItem,
  removeCartItem,
  setCartItemStatus,
  updateCartQuantity,
} from "@/lib/data/cart";
import { productSnapshotSchema, quantitySchema, type ProductSnapshot } from "@/lib/data/schemas";
import { addWishlistItem } from "@/lib/data/wishlist";
import { toActionError, type ActionResult } from "./result";

const idSchema = z.string().min(1).max(64);

export async function addToCartAction(product: ProductSnapshot, quantity = 1): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    const snapshot = productSnapshotSchema.parse(product);
    await ensureProfile(user);
    await addCartItem(user.id, snapshot, quantitySchema.parse(quantity));
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCartQuantityAction(itemId: string, quantity: number): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    await updateCartQuantity(user.id, idSchema.parse(itemId), quantitySchema.parse(quantity));
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    await removeCartItem(user.id, idSchema.parse(itemId));
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markCartItemOrderedAction(itemId: string, ordered: boolean): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    await setCartItemStatus(user.id, idSchema.parse(itemId), z.boolean().parse(ordered));
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function clearOrderedItemsAction(): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    await clearOrderedItems(user.id);
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveCartItemToWishlistAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireUserForMutation();
    const item = await findCartItem(user.id, idSchema.parse(itemId));
    if (!item) return { ok: false, error: "Item not found", code: "invalid" };
    await addWishlistItem(user.id, {
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
    await removeCartItem(user.id, item.id);
    refresh();
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
