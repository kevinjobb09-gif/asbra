/**
 * Ser till att vi bara skickar vidare till sidor på den egna sajten.
 * Annars skulle någon kunna skapa en inloggningslänk som leder till en falsk sajt.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
