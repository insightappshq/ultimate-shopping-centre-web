import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/auth/dal";
import { rethrowNextErrors } from "@/lib/errors";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; code?: "unauthorized" | "invalid" | "server" };

/** Converts thrown errors into a serialisable result for client components. */
export function toActionError(error: unknown): Extract<ActionResult, { ok: false }> {
  rethrowNextErrors(error);
  if (error instanceof UnauthorizedError) {
    return { ok: false, error: error.message, code: "unauthorized" };
  }
  if (error instanceof ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Invalid input", code: "invalid" };
  }
  console.error("[action]", error);
  return { ok: false, error: "Something went wrong. Please try again.", code: "server" };
}
