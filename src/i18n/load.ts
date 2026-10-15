import type { LanguageCode } from "@/config";
import { sv, type Messages } from "./messages/sv";
import { withFallback } from "./translate";

/** Läser in texterna för ett språk (med svenska som reserv). Bara det valda språket laddas. */
export async function loadMessages(lang: LanguageCode): Promise<Messages> {
  if (lang === "sv") return sv;
  try {
    const mod = (await import(`./messages/${lang}.json`)) as { default: unknown };
    return withFallback(mod.default);
  } catch {
    return sv;
  }
}
