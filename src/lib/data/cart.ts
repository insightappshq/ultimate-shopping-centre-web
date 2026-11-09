import "server-only";
import { PLATFORM_IDS, isPlatformId, type PlatformId } from "@/config/platforms";
import type { CartItem as CartItemRow } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fromPaise, toPaise } from "@/lib/format";
import type { ProductSnapshot } from "./schemas";

/* All functions take the authenticated user's id from the DAL; never from input. */

export interface CartItem {
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
  quantity: number;
  status: "PENDING" | "ORDERED";
  orderedAt: string | null;
  addedAt: string;
}

export interface CartPlatformGroup {
  platform: PlatformId;
  items: CartItem[];
  subtotal: number;
  mrpTotal: number;
  pendingCount: number;
}

export interface Cart {
  items: CartItem[];
  groups: CartPlatformGroup[];
  itemCount: number;
  pendingCount: number;
  total: number;
  pendingTotal: number;
  savings: number;
}

function toCartItem(row: CartItemRow): CartItem | null {
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
    quantity: row.quantity,
    status: row.status,
    orderedAt: row.orderedAt?.toISOString() ?? null,
    addedAt: row.createdAt.toISOString(),
  };
}

export async function getCart(userId: string): Promise<Cart> {
  const rows = await db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const items = rows.map(toCartItem).filter((item): item is CartItem => item !== null);

  const groups: CartPlatformGroup[] = PLATFORM_IDS.map((platform) => {
    const platformItems = items.filter((item) => item.platform === platform);
    return {
      platform,
      items: platformItems,
      subtotal: platformItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      mrpTotal: platformItems.reduce((sum, i) => sum + (i.mrp ?? i.price) * i.quantity, 0),
      pendingCount: platformItems.filter((i) => i.status === "PENDING").length,
    };
  }).filter((group) => group.items.length > 0);

  const pending = items.filter((item) => item.status === "PENDING");
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const mrpTotal = items.reduce((sum, i) => sum + (i.mrp ?? i.price) * i.quantity, 0);

  return {
    items,
    groups,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    pendingCount: pending.length,
    total,
    pendingTotal: pending.reduce((sum, i) => sum + i.price * i.quantity, 0),
    savings: Math.max(0, mrpTotal - total),
  };
}

export async function getCartCount(userId: string): Promise<number> {
  const result = await db.cartItem.aggregate({
    where: { userId, status: "PENDING" },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function addCartItem(userId: string, product: ProductSnapshot, quantity = 1) {
  const snapshot = {
    name: product.name,
    brand: product.brand ?? null,
    imageUrl: product.image ?? null,
    packSize: product.quantity ?? null,
    pricePaise: toPaise(product.price),
    mrpPaise: product.mrp ? toPaise(product.mrp) : null,
    deeplink: product.deeplink ?? null,
  };
  return db.cartItem.upsert({
    where: {
      userId_platform_productId: { userId, platform: product.platform, productId: product.productId },
    },
    create: { userId, platform: product.platform, productId: product.productId, quantity, ...snapshot },
    // Re-adding refreshes the price snapshot and bumps the quantity.
    update: { ...snapshot, quantity: { increment: quantity }, status: "PENDING", orderedAt: null },
  });
}

export async function updateCartQuantity(userId: string, itemId: string, quantity: number) {
  return db.cartItem.updateMany({ where: { id: itemId, userId }, data: { quantity } });
}

export async function setCartItemStatus(userId: string, itemId: string, ordered: boolean) {
  return db.cartItem.updateMany({
    where: { id: itemId, userId },
    data: { status: ordered ? "ORDERED" : "PENDING", orderedAt: ordered ? new Date() : null },
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  return db.cartItem.deleteMany({ where: { id: itemId, userId } });
}

export async function clearOrderedItems(userId: string) {
  return db.cartItem.deleteMany({ where: { userId, status: "ORDERED" } });
}

export async function findCartItem(userId: string, itemId: string) {
  const row = await db.cartItem.findFirst({ where: { id: itemId, userId } });
  return row ? toCartItem(row) : null;
}

export async function getCartKeys(userId: string): Promise<string[]> {
  const rows = await db.cartItem.findMany({
    where: { userId, status: "PENDING" },
    select: { platform: true, productId: true },
  });
  return rows.map((row) => `${row.platform}:${row.productId}`);
}
