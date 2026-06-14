/**
 * A two-armed result type for code that can fail with a typed error
 * instead of throwing. Discriminated by `ok` so TS narrows in branches.
 *
 * Use the `ok(value)` / `err(reason)` constructors so callsites stay
 * uncluttered:
 *
 *   if (!result.ok) {
 *     return err(result.error);
 *   }
 *   doThingWith(result.value);
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
