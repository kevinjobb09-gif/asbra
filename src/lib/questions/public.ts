import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { CountryCode } from "@/config";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PracticeQuestion } from "@/lib/practice/session";

const PRACTICE_COLUMNS = "id, chapter, section, question, options, correct_index, explanation, source_reference";

/**
 * Klient med den publika nyckeln och utan inloggning – samma behörighet som
 * en okänd besökare. Databasens regler (RLS) släpper bara igenom granskade frågor.
 */
function publicClient() {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Granskade frågor i ett kapitel. */
export async function getReviewedQuestions(country: CountryCode, chapter: number): Promise<PracticeQuestion[]> {
  const { data, error } = await publicClient()
    .from("questions")
    .select(PRACTICE_COLUMNS)
    .eq("country", country)
    .eq("chapter", chapter)
    .eq("status", "reviewed") // Dubbel säkerhet utöver RLS.
    .order("id");
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return data as PracticeQuestion[];
}

/** Antal granskade frågor per kapitel. */
export async function getReviewedCountsByChapter(country: CountryCode): Promise<Map<number, number>> {
  const { data, error } = await publicClient()
    .from("questions")
    .select("chapter")
    .eq("country", country)
    .eq("status", "reviewed");
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  const counts = new Map<number, number>();
  for (const row of data) counts.set(row.chapter, (counts.get(row.chapter) ?? 0) + 1);
  return counts;
}

/**
 * BARA FÖR ADMIN: alla frågor i ett kapitel, även utkast, för att förhandsgranska.
 * Anropa bara efter att admin-behörigheten kontrollerats.
 */
export async function getAllQuestionsForPreview(country: CountryCode, chapter: number): Promise<PracticeQuestion[]> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .select(PRACTICE_COLUMNS)
    .eq("country", country)
    .eq("chapter", chapter)
    .order("id");
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return data as PracticeQuestion[];
}
