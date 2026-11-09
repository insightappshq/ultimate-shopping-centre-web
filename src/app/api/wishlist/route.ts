import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import { productSnapshotSchema } from "@/lib/data/schemas";
import { addWishlistItem, getWishlist } from "@/lib/data/wishlist";

/** GET /api/wishlist */
export async function GET() {
  try {
    const user = await requireUserForMutation();
    return ok(await getWishlist(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/wishlist — { product } */
export async function POST(request: Request) {
  try {
    const user = await requireUserForMutation();
    const { product } = z.object({ product: productSnapshotSchema }).parse(await readJson(request));
    await ensureProfile(user);
    const item = await addWishlistItem(user.id, product);
    return ok({ id: item.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
