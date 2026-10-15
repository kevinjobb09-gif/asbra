import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CountryCode, LanguageCode } from "@/config";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createUserClient } from "@/lib/supabase/server";
import type { ExplanationTranslation, PracticeQuestion } from "@/lib/practice/session";

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

type Row = PracticeQuestion & { question_translations?: ExplanationTranslation[] };

/**
 * Bygger en fråga mot tabellen questions. För andra språk än svenska hämtas
 * förklaringens översättning till just det språket i samma anrop.
 */
function selectQuestions(supabase: SupabaseClient, lang: LanguageCode) {
  if (lang === "sv") return supabase.from("questions").select(PRACTICE_COLUMNS);
  return supabase
    .from("questions")
    .select(`${PRACTICE_COLUMNS}, question_translations(language, explanation, status)`)
    .eq("question_translations.language", lang);
}

function toPractice(rows: unknown[] | null): PracticeQuestion[] {
  return ((rows ?? []) as Row[]).map(({ question_translations, ...q }) => ({
    ...q,
    translation: question_translations?.[0] ?? null,
  }));
}

async function run(query: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const { data, error } = await query;
  if (error) throw new Error(`Kunde inte hämta frågor: ${error.message}`);
  return toPractice(data);
}

/** Granskade gratisfrågor – det som visas i gratisläget. */
export function getFreeQuestionPool(country: CountryCode, lang: LanguageCode): Promise<PracticeQuestion[]> {
  return run(
    selectQuestions(publicClient(), lang)
      .eq("country", country)
      .eq("status", "reviewed") // Dubbel säkerhet utöver RLS.
      .eq("is_free", true),
  );
}

/** En enskild granskad gratisfråga (för delbara sidor). Andra frågor visas aldrig publikt. */
export async function getFreeQuestion(id: string, lang: LanguageCode): Promise<PracticeQuestion | null> {
  const rows = await run(selectQuestions(publicClient(), lang).eq("id", id).eq("status", "reviewed").eq("is_free", true));
  return rows[0] ?? null;
}

/**
 * Granskade frågor i ett kapitel för den inloggade användaren.
 * Användarens egen inloggning används, så databasen (RLS) bestämmer vad hen får se.
 * Admin hämtar med den hemliga nyckeln, men fortfarande bara granskade frågor.
 */
export async function getChapterQuestions(
  country: CountryCode,
  chapter: number,
  { isAdmin, lang }: { isAdmin: boolean; lang: LanguageCode },
): Promise<PracticeQuestion[]> {
  const supabase = isAdmin ? createAdminClient() : await createUserClient();
  return run(
    selectQuestions(supabase, lang).eq("country", country).eq("chapter", chapter).eq("status", "reviewed").order("id"),
  );
}

/** Alla granskade frågor som användaren har tillgång till (till provsimuleringen). */
export async function getAllReviewedQuestions(
  country: CountryCode,
  { isAdmin, lang }: { isAdmin: boolean; lang: LanguageCode },
): Promise<PracticeQuestion[]> {
  const supabase = isAdmin ? createAdminClient() : await createUserClient();
  return run(selectQuestions(supabase, lang).eq("country", country).eq("status", "reviewed"));
}

/** Granskade frågor med vissa id, i samma ordning som `ids`. Användarens behörighet gäller (RLS). */
export async function getReviewedQuestionsByIds(
  ids: string[],
  { isAdmin, lang }: { isAdmin: boolean; lang: LanguageCode },
): Promise<PracticeQuestion[]> {
  if (ids.length === 0) return [];
  const supabase = isAdmin ? createAdminClient() : await createUserClient();
  const rows = await run(selectQuestions(supabase, lang).in("id", ids).eq("status", "reviewed"));
  const byId = new Map(rows.map((q) => [q.id, q]));
  return ids.flatMap((id) => byId.get(id) ?? []);
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
export function getAllQuestionsForPreview(
  country: CountryCode,
  { chapter, lang }: { chapter?: number; lang: LanguageCode },
): Promise<PracticeQuestion[]> {
  let query = selectQuestions(createAdminClient(), lang).eq("country", country).order("id");
  if (chapter) query = query.eq("chapter", chapter);
  return run(query);
}
