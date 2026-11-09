import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { ensureProfile, requireUserForMutation } from "@/lib/auth/dal";
import { addCartItem, clearOrderedItems, getCart } from "@/lib/data/cart";
import { productSnapshotSchema, quantitySchema } from "@/lib/data/schemas";

/** GET /api/cart — the signed-in user's cart, grouped by platform. */
export async function GET() {
  try {
    const user = await requireUserForMutation();
    return ok(await getCart(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

const addSchema = z.object({ product: productSnapshotSchema, quantity: quantitySchema.default(1) });

/** POST /api/cart — { product, quantity } adds or increments a listing. */
export async function POST(request: Request) {
  try {
    const user = await requireUserForMutation();
    const { product, quantity } = addSchema.parse(await readJson(request));
    await ensureProfile(user);
    const item = await addCartItem(user.id, product, quantity);
    return ok({ id: item.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/cart — clears items already marked as purchased. */
export async function DELETE() {
  try {
    const user = await requireUserForMutation();
    const { count } = await clearOrderedItems(user.id);
    return ok({ removed: count });
  } catch (error) {
    return handleApiError(error);
  }
}
