import "server-only";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/auth/dal";
import { rethrowNextErrors } from "@/lib/errors";

/** Consistent JSON envelope for the public REST API. */
export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export function handleApiError(error: unknown) {
  rethrowNextErrors(error);
  if (error instanceof UnauthorizedError) return fail(401, "unauthorized", error.message);
  if (error instanceof ZodError) {
    return fail(422, "invalid_request", error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  console.error("[api]", error);
  return fail(500, "internal_error", "Something went wrong");
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ZodError([{ code: "custom", message: "Body must be valid JSON", path: [], input: undefined }]);
  }
}
