import "server-only";
import { db } from "@/lib/db";
import type { GeoLocation } from "@/lib/quickcommerce/types";

const MAX_HISTORY = 8;

export async function getProfile(userId: string) {
  return db.profile.findUnique({ where: { id: userId } });
}

export async function updateProfileName(userId: string, fullName: string) {
  return db.profile.update({ where: { id: userId }, data: { fullName } });
}

export async function saveProfileLocation(userId: string, location: GeoLocation) {
  return db.profile.updateMany({
    where: { id: userId },
    data: {
      locationLabel: location.label,
      latitude: location.lat,
      longitude: location.lon,
      pincode: location.pincode,
    },
  });
}

export async function getRecentSearches(userId: string): Promise<string[]> {
  const rows = await db.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
    select: { query: true },
  });
  return rows.map((row) => row.query);
}

export async function recordSearch(userId: string, query: string) {
  const normalised = query.trim().toLowerCase().slice(0, 120);
  if (!normalised) return;
  await db.searchHistory.upsert({
    where: { userId_query: { userId, query: normalised } },
    create: { userId, query: normalised },
    update: { createdAt: new Date() },
  });
}

export async function clearSearchHistory(userId: string) {
  await db.searchHistory.deleteMany({ where: { userId } });
}

export async function getAccountStats(userId: string) {
  const [cartPending, cartOrdered, wishlist, searches] = await Promise.all([
    db.cartItem.count({ where: { userId, status: "PENDING" } }),
    db.cartItem.count({ where: { userId, status: "ORDERED" } }),
    db.wishlistItem.count({ where: { userId } }),
    db.searchHistory.count({ where: { userId } }),
  ]);
  return { cartPending, cartOrdered, wishlist, searches };
}
