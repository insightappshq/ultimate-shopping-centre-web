import { unstable_rethrow } from "next/navigation";

/**
 * `.catch()` handler that substitutes a fallback for application errors while
 * re-throwing Next.js control-flow errors (redirect, notFound, dynamic bailout),
 * which must never be swallowed.
 */
export function fallbackTo<T>(value: T) {
  return (error: unknown): T => {
    unstable_rethrow(error);
    console.error(error);
    return value;
  };
}

export { unstable_rethrow as rethrowNextErrors };
