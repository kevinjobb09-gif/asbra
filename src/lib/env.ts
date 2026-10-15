/**
 * Läser miljövariabler och ger ett tydligt felmeddelande om något saknas.
 * Värdena läggs i .env.local (se .env.example).
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Miljövariabeln ${name} saknas. Lägg till den i .env.local (se .env.example) och starta om servern.`,
    );
  }
  return value;
}

// NEXT_PUBLIC_-variabler måste skrivas ut med fullt namn för att Next ska kunna bygga in dem.
export const publicEnv = {
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabasePublishableKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** Bara på servern. Importera aldrig i en klientkomponent. */
export const serverEnv = {
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
  },
  get adminEmails(): string[] {
    return parseEmailList(process.env.ADMIN_EMAILS);
  },
};

export function parseEmailList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
