import { z } from "zod";
import { PLATFORM_IDS } from "@/config/platforms";
import type { Offer } from "@/lib/quickcommerce/types";

/**
 * Snapshot of a listing as shown to the shopper when they saved it. The cart
 * and wishlist are personal reminders (checkout happens on the platform), so a
 * client-supplied snapshot is acceptable; it is still validated and bounded.
 */
export const productSnapshotSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  productId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(300),
  brand: z.string().trim().max(120).nullish(),
  image: z.url().max(2000).nullish(),
  quantity: z.string().trim().max(80).nullish(),
  price: z.number().positive().max(10_000_000),
  mrp: z.number().positive().max(10_000_000).nullish(),
  deeplink: z.url().max(2000).nullish(),
});

export type ProductSnapshot = z.infer<typeof productSnapshotSchema>;

export function toSnapshot(offer: Offer): ProductSnapshot {
  return {
    platform: offer.platform,
    productId: offer.productId,
    name: offer.name,
    brand: offer.brand,
    image: offer.image,
    quantity: offer.quantity,
    price: offer.price,
    mrp: offer.mrp,
    deeplink: offer.deeplink,
  };
}

export const MAX_CART_QUANTITY = 20;

export const quantitySchema = z.number().int().min(1).max(MAX_CART_QUANTITY);
