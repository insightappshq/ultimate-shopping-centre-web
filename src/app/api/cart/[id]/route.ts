import { z } from "zod";
import { fail, handleApiError, ok, readJson } from "@/lib/api";
import { requireUserForMutation } from "@/lib/auth/dal";
import { removeCartItem, setCartItemStatus, updateCartQuantity } from "@/lib/data/cart";
import { quantitySchema } from "@/lib/data/schemas";

const patchSchema = z
  .object({ quantity: quantitySchema.optional(), status: z.enum(["PENDING", "ORDERED"]).optional() })
  .refine((body) => body.quantity !== undefined || body.status !== undefined, {
    message: "Provide quantity and/or status",
  });

/** PATCH /api/cart/:id — { quantity?, status? } */
export async function PATCH(request: Request, ctx: RouteContext<"/api/cart/[id]">) {
  try {
    const user = await requireUserForMutation();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await readJson(request));

    let updated = 0;
    if (body.quantity !== undefined) updated = (await updateCartQuantity(user.id, id, body.quantity)).count;
    if (body.status !== undefined) {
      updated = (await setCartItemStatus(user.id, id, body.status === "ORDERED")).count;
    }
    if (!updated) return fail(404, "not_found", "Cart item not found");
    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/cart/:id */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/cart/[id]">) {
  try {
    const user = await requireUserForMutation();
    const { id } = await ctx.params;
    const { count } = await removeCartItem(user.id, id);
    if (!count) return fail(404, "not_found", "Cart item not found");
    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
