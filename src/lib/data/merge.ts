import "server-only";
import { db } from "@/lib/db";

/** Copies rows to another owner, letting the database assign fresh ids. */
function reassign<T extends { id: string; userId: string }>(rows: T[], userId: string): Omit<T, "id">[] {
  return rows.map((row) => {
    const copy: Partial<T> = { ...row, userId };
    delete copy.id;
    return copy as Omit<T, "id">;
  });
}

/**
 * Moves everything owned by `fromUserId` onto `intoUserId` and removes the
 * source profile, in one transaction. Where both accounts have the same item,
 * the surviving account's copy wins. Profile gaps (name, location) on the
 * survivor are filled from the source.
 */
export async function mergeAccountData(fromUserId: string, intoUserId: string) {
  await db.$transaction(async (tx) => {
    const [from, into] = await Promise.all([
      tx.profile.findUnique({ where: { id: fromUserId } }),
      tx.profile.findUnique({ where: { id: intoUserId } }),
    ]);

    // Make sure the survivor's profile exists before children point at it.
    if (!into) {
      await tx.profile.create({ data: { id: intoUserId } });
    }

    const [cart, wishlist, searches] = await Promise.all([
      tx.cartItem.findMany({ where: { userId: fromUserId } }),
      tx.wishlistItem.findMany({ where: { userId: fromUserId } }),
      tx.searchHistory.findMany({ where: { userId: fromUserId } }),
    ]);
    if (cart.length) {
      await tx.cartItem.createMany({
        data: reassign(cart, intoUserId),
        skipDuplicates: true,
      });
    }
    if (wishlist.length) {
      await tx.wishlistItem.createMany({
        data: reassign(wishlist, intoUserId),
        skipDuplicates: true,
      });
    }
    if (searches.length) {
      await tx.searchHistory.createMany({
        data: reassign(searches, intoUserId),
        skipDuplicates: true,
      });
    }

    // Deleting the source profile cascades its (now copied) rows.
    if (from) await tx.profile.delete({ where: { id: fromUserId } });

    const survivor = into ?? { fullName: null, pincode: null };
    await tx.profile.update({
      where: { id: intoUserId },
      data: {
        fullName: survivor.fullName ?? from?.fullName ?? undefined,
        ...(survivor.pincode || !from?.pincode
          ? {}
          : {
              locationLabel: from.locationLabel,
              latitude: from.latitude,
              longitude: from.longitude,
              pincode: from.pincode,
            }),
      },
    });
  });
}
