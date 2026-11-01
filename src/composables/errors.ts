/** The message of an exception, or the value itself as text. */
export function errorMessage(failure: unknown): string {
  const message = (failure as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : String(failure);
}
