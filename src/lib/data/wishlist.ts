import "server-only";
import { isPlatformId, type PlatformId } from "@/config/platforms";
import type { WishlistItem as WishlistRow } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fromPaise, toPaise } from "@/lib/format";
import type { ProductSnapshot } from "./schemas";

export interface WishlistItem {
  id: string;
  platform: PlatformId;
  productId: string;
  name: string;
  brand: string | null;
  image: string | null;
  packSize: string | null;
  price: number;
  mrp: number | null;
  deeplink: string | null;
  savedAt: string;
}

function toWishlistItem(row: WishlistRow): WishlistItem | null {
  if (!isPlatformId(row.platform)) return null;
  return {
    id: row.id,
    platform: row.platform,
    productId: row.productId,
    name: row.name,
    brand: row.brand,
    image: row.imageUrl,
    packSize: row.packSize,
    price: fromPaise(row.pricePaise),
    mrp: row.mrpPaise === null ? null : fromPaise(row.mrpPaise),
    deeplink: row.deeplink,
    savedAt: row.createdAt.toISOString(),
  };
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const rows = await db.wishlistItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(toWishlistItem).filter((item): item is WishlistItem => item !== null);
}

export async function getWishlistKeys(userId: string): Promise<string[]> {
  const rows = await db.wishlistItem.findMany({
    where: { userId },
    select: { platform: true, productId: true },
  });
  return rows.map((row) => `${row.platform}:${row.productId}`);
}

export async function getWishlistCount(userId: string): Promise<number> {
  return db.wishlistItem.count({ where: { userId } });
}

export async function addWishlistItem(userId: string, product: ProductSnapshot) {
  const snapshot = {
    name: product.name,
    brand: product.brand ?? null,
    imageUrl: product.image ?? null,
    packSize: product.quantity ?? null,
    pricePaise: toPaise(product.price),
    mrpPaise: product.mrp ? toPaise(product.mrp) : null,
    deeplink: product.deeplink ?? null,
  };
  return db.wishlistItem.upsert({
    where: {
      userId_platform_productId: { userId, platform: product.platform, productId: product.productId },
    },
    create: { userId, platform: product.platform, productId: product.productId, ...snapshot },
    update: snapshot,
  });
}

export async function removeWishlistItem(userId: string, itemId: string) {
  return db.wishlistItem.deleteMany({ where: { id: itemId, userId } });
}

export async function removeWishlistProduct(userId: string, platform: PlatformId, productId: string) {
  return db.wishlistItem.deleteMany({ where: { userId, platform, productId } });
}

export async function findWishlistItem(userId: string, itemId: string) {
  const row = await db.wishlistItem.findFirst({ where: { id: itemId, userId } });
  return row ? toWishlistItem(row) : null;
}
