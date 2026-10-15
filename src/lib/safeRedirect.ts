/**
 * Ser till att vi bara skickar vidare till sidor på den egna sajten.
 * Annars skulle någon kunna skapa en inloggningslänk som leder till en falsk sajt.
 *
 * `next` kan vara en sökväg ("/konto") eller en hel adress på samma sajt
 * ("https://min-sajt.se/konto"), eftersom e-postmallen skickar hela adressen.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/", origin?: string): string {
  if (!next) return fallback;
  if (origin && /^https?:\/\//i.test(next)) {
    try {
      const url = new URL(next);
      if (url.origin !== new URL(origin).origin) return fallback;
      return safeRedirectPath(url.pathname + url.search, fallback);
    } catch {
      return fallback;
    }
  }
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
