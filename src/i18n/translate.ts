import { sv, type MessageKey, type Messages } from "./messages/sv";

export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

/** Lägger ihop ett språks texter med de svenska, så att saknade texter visas på svenska. */
export function withFallback(partial: unknown, base: Messages = sv): Messages {
  if (!partial || typeof partial !== "object") return base;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(base)) {
    const other = (partial as Record<string, unknown>)[key];
    result[key] =
      typeof value === "string"
        ? typeof other === "string" && other.trim()
          ? other
          : value
        : withFallback(other, value as unknown as Messages);
  }
  return result as Messages;
}

/** Byter {namn} mot värden. Okända platshållare lämnas kvar så att felet syns. */
export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function createTranslator(messages: Messages): Translate {
  return (key, vars) => {
    let node: unknown = messages;
    for (const part of key.split(".")) node = (node as Record<string, unknown>)?.[part];
    return interpolate(typeof node === "string" ? node : key, vars);
  };
}
