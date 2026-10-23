/**
 * ÖVERSÄTT FÖRKLARINGAR MED CLAUDE
 *
 * Översätter förklaringen till alla GRANSKADE frågor till alla språk som saknas.
 * Översättningarna sparas som "maskinöversatta" och märks så i appen tills du
 * (eller någon som kan språket) har granskat dem på adminsidan.
 * Frågan och svarsalternativen översätts aldrig – de är på svenska som på provet.
 *
 * Exempel:
 *   npm run oversatt-forklaringar                 (alla språk som saknas)
 *   npm run oversatt-forklaringar -- --sprak ar,fa
 *   npm run oversatt-forklaringar -- --test       (3 frågor, visa bara, spara inget)
 *   npm run oversatt-forklaringar -- --antal 20   (bara de 20 första frågorna)
 *
 * Skriptet skriver ut hur många tokens som gick åt och ungefär vad det kostade.
 */
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getCountry, languages, LANGUAGE_CODES, type LanguageCode } from "../src/config";

const MODEL = "claude-opus-5-5";
// Pris i dollar per miljon tokens för modellen ovan (in, ut). Används bara för kostnadsutskriften.
const PRICE = { input: 4, output: 20 };

const { values } = parseArgs({
  options: {
    sprak: { type: "string" },
    land: { type: "string", default: "se" },
    test: { type: "boolean", default: false },
    antal: { type: "string" },
  },
});
const limit = Number(values.antal ?? (values.test ? 3 : Infinity));
if (!(limit > 0)) fail("--antal ska vara ett tal större än 0.");

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

const country = getCountry(values.land as "se");
const targets = (values.sprak ? values.sprak.split(",").map((s) => s.trim()) : country.explanationLanguages).filter(
  (c): c is LanguageCode => (LANGUAGE_CODES as readonly string[]).includes(c) && c !== country.examLanguage,
);
if (targets.length === 0) fail("Inga giltiga språk. Exempel: --sprak ar,fa");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SECRET_KEY saknas i .env.local.");
const db = createClient(url, key, { auth: { persistSession: false } });

const SYSTEM_PROMPT = `Du översätter korta förklaringar i en övningsapp inför det svenska medborgarskapsprovet i samhällskunskap. Läsarna är vuxna som lär sig om Sverige och ofta har svenska som andraspråk.

Regler:
- Översätt troget. Lägg inte till och ta inte bort fakta.
- Skriv enkelt och tydligt, med korta meningar och vardagliga ord.
- Svenska namn och begrepp som är viktiga för provet (t.ex. riksdagen, regeringen, kommunen, allemansrätten, Sverige i fokus) behålls på svenska första gången, följt av en kort förklaring eller översättning inom parentes.
- Behåll siffror, årtal och procent exakt.
- Använd det skriftsystem som är normalt för språket (t.ex. arabisk skrift för arabiska, persiska, dari, pashto, sorani och urdu; latinsk skrift för kurmanji; ge'ez för tigrinja och amhariska).
- Dari (prs) ska vara afghansk dari, inte iransk persiska.
- Svara bara med översättningarna.`;

const Output = z.object({
  translations: z.array(z.object({ language: z.string(), text: z.string() })),
});

async function main() {
  const { data: questions, error } = await db
    .from("questions")
    .select("id, question, explanation, question_translations(language)")
    .eq("country", country.code)
    .eq("status", "reviewed");
  if (error) fail(`Kunde inte hämta frågor: ${error.message}`);

  const work = (questions ?? [])
    .map((q) => {
      const have = new Set((q.question_translations as { language: string }[]).map((t) => t.language));
      return { ...q, missing: targets.filter((l) => !have.has(l)) };
    })
    .filter((q) => q.missing.length > 0)
    .slice(0, limit);

  if (work.length === 0) {
    console.log("\n✅ Alla granskade frågor har redan förklaringar på de valda språken.\n");
    return;
  }
  console.log(`\n⏳ Översätter ${work.length} förklaringar (${targets.length} språk) …\n`);

  const client = new Anthropic();
  let saved = 0;
  const used = { input: 0, output: 0 };
  for (const [n, q] of work.entries()) {
    const list = q.missing.map((c) => `${c} = ${languages[c].swedishName}`).join(", ");
    let response;
    try {
      response = await client.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: betaZodOutputFormat(Output) },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Frågan (för sammanhang, översätt den inte): ${q.question}\n\nÖversätt den här förklaringen till följande språk (språkkod = språk): ${list}\n\n<forklaring>\n${q.explanation}\n</forklaring>`,
          },
        ],
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) fail("ANTHROPIC_API_KEY saknas eller är fel i .env.local.");
      if (e instanceof Anthropic.APIError) {
        console.warn(`⚠️  Fråga ${n + 1}: Claude svarade med fel ${e.status}. Hoppar över.`);
        continue;
      }
      throw e;
    }
    used.input += response.usage.input_tokens;
    used.output += response.usage.output_tokens;
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      console.warn(`⚠️  Fråga ${n + 1}: ingen översättning. Hoppar över.`);
      continue;
    }

    const rows = response.parsed_output.translations
      .filter((t) => q.missing.includes(t.language as LanguageCode) && t.text.trim().length > 0)
      .map((t) => ({ question_id: q.id, language: t.language, explanation: t.text.trim(), status: "machine" }));
    const lacking = q.missing.filter((l) => !rows.some((r) => r.language === l));
    if (lacking.length) console.warn(`⚠️  Fråga ${n + 1}: saknar ${lacking.join(", ")} – kör skriptet igen senare.`);

    if (values.test) {
      console.log(`\n${n + 1}. ${q.question}`);
      for (const r of rows) console.log(`   [${r.language}] ${r.explanation}`);
      continue;
    }
    // Skriver aldrig över en översättning som redan finns (t.ex. en granskad).
    const { error: insertError } = await db
      .from("question_translations")
      .upsert(rows, { onConflict: "question_id,language", ignoreDuplicates: true });
    if (insertError) fail(`Kunde inte spara: ${insertError.message}`);
    saved += rows.length;
    process.stdout.write(`✔ ${n + 1}/${work.length}\r`);
  }

  console.log(values.test ? "\n🧪 Testläge: inget sparades.\n" : `\n✅ ${saved} översättningar sparade som maskinöversatta.\n`);
  const dollars = (used.input * PRICE.input + used.output * PRICE.output) / 1e6;
  console.log(`💰 ${used.input} tokens in, ${used.output} tokens ut ≈ $${dollars.toFixed(2)} för ${work.length} frågor.\n`);
}

main();
