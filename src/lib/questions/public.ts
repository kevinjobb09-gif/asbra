import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { CountryCode } from "@/config";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createUserClient } from "@/lib/supabase/server";
import type { PracticeQuestion } from "@/lib/practice/session";

const PRACTICE_COLUMNS = "id, chapter, section, question, options, correct_index, explanation, source_reference";

/**
 * Klient med den publika nyckeln och utan inloggning – samma behörighet som
 * en okänd besökare. Databasens regler (RLS) släpper bara igenom granskade gratisfrågor.
 */
function publicClient() {
  return createSupabaseClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Granskade gratisfrågor – det som visas i gratisläget. */
export async function getFreeQuestionPool(country: CountryCode): Promise<PracticeQuestion[]> {
  const { data, error } = await publicClient()
    .from("questions")
    .select(PRACTICE_COLUMNS)
    .eq("country", country)
    .eq("status", "reviewed") // Dubbel säkerhet utöver RLS.
    .eq("is_free", true);
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return data as PracticeQuestion[];
}

/**
 * Granskade frågor i ett kapitel för den inloggade användaren.
 * Användarens egen inloggning används, så databasen (RLS) bestämmer vad hen får se.
 * Admin hämtar med den hemliga nyckeln, men fortfarande bara granskade frågor.
 */
export async function getChapterQuestions(
  country: CountryCode,
  chapter: number,
  { isAdmin }: { isAdmin: boolean },
): Promise<PracticeQuestion[]> {
  const supabase = isAdmin ? createAdminClient() : await createUserClient();
  const { data, error } = await supabase
    .from("questions")
    .select(PRACTICE_COLUMNS)
    .eq("country", country)
    .eq("chapter", chapter)
    .eq("status", "reviewed")
    .order("id");
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return data as PracticeQuestion[];
}

/** Antal granskade frågor per kapitel (bara siffror, inget innehåll). */
export async function getReviewedCountsByChapter(country: CountryCode): Promise<Map<number, number>> {
  const { data, error } = await createAdminClient()
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
 * BARA FÖR ADMIN: frågor inklusive utkast, för att förhandsgranska.
 * Anropa bara efter att admin-behörigheten kontrollerats.
 */
export async function getAllQuestionsForPreview(country: CountryCode, chapter?: number): Promise<PracticeQuestion[]> {
  let query = createAdminClient().from("questions").select(PRACTICE_COLUMNS).eq("country", country).order("id");
  if (chapter) query = query.eq("chapter", chapter);
  const { data, error } = await query;
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return data as PracticeQuestion[];
}

/** Alla granskade frågor som användaren har tillgång till (till provsimuleringen). */
export async function getAllReviewedQuestions(
  country: CountryCode,
  { isAdmin }: { isAdmin: boolean },
): Promise<PracticeQuestion[]> {
  const supabase = isAdmin ? createAdminClient() : await createUserClient();
  const { data, error } = await supabase
    .from("questions")
    .select(PRACTICE_COLUMNS)
    .eq("country", country)
    .eq("status", "reviewed");
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return data as PracticeQuestion[];
}

/** Granskade frågor med vissa id, i samma ordning som `ids`. Användarens behörighet gäller (RLS). */
export async function getReviewedQuestionsByIds(
  ids: string[],
  { isAdmin }: { isAdmin: boolean },
): Promise<PracticeQuestion[]> {
  if (ids.length === 0) return [];
  const supabase = isAdmin ? createAdminClient() : await createUserClient();
  const { data, error } = await supabase
    .from("questions")
    .select(PRACTICE_COLUMNS)
    .in("id", ids)
    .eq("status", "reviewed");
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  const byId = new Map((data as PracticeQuestion[]).map((q) => [q.id, q]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}
