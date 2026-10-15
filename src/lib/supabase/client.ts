"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/** Supabase-klient för webbläsaren. Följer databasens säkerhetsregler (RLS). */
export function getBrowserClient(): SupabaseClient {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return client;
}

/**
 * Ser till att besökaren har en (anonym) inloggning, så att svar och
 * felrapporter kan sparas utan att man skapat konto. Returnerar användarens id.
 */
export async function ensureUser(): Promise<string | null> {
  const supabase = getBrowserClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Kunde inte starta anonym session:", error.message);
    return null;
  }
  return anon.user?.id ?? null;
}
