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
 *   npm run oversatt-forklaringar -- --batch      (alla på en gång till halva priset, svar inom ~1 timme)
 *   npm run oversatt-forklaringar -- --hamta <id> (hämta svaren från en batch som redan skickats)
 *   npm run oversatt-forklaringar -- --niva low   (mindre tänkande = billigare; standard är medium)
 *   npm run oversatt-forklaringar -- --modell sonnet (Claude Sonnet 5.5, halva priset mot Opus)
 *
 * Skriptet skriver ut hur många tokens som gick åt och ungefär vad det kostade.
 */
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getCountry, languages, LANGUAGE_CODES, type LanguageCode } from "../src/config";

// Pris i dollar per miljon tokens (in, ut). Används bara för kostnadsutskriften.
const MODELS = {
  opus: { id: "claude-opus-5-5", price: { input: 4, output: 20 } },
  sonnet: { id: "claude-sonnet-5-5", price: { input: 2, output: 10 } },
} as const;

const { values } = parseArgs({
  options: {
    modell: { type: "string", default: "opus" },
    sprak: { type: "string" },
    land: { type: "string", default: "se" },
    test: { type: "boolean", default: false },
    antal: { type: "string" },
    batch: { type: "boolean", default: false },
    hamta: { type: "string" },
    niva: { type: "string", default: "medium" },
  },
});
if (!(values.modell in MODELS)) fail("--modell ska vara opus eller sonnet.");
const { id: MODEL, price: PRICE } = MODELS[values.modell as keyof typeof MODELS];
const BETA = "server-side-fallback-2026-07-01";
type Effort = "low" | "medium" | "high";
if (!["low", "medium", "high"].includes(values.niva)) fail("--niva ska vara low, medium eller high.");
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

type Work = { id: string; question: string; explanation: string; missing: LanguageCode[] };

function paramsFor(q: Work) {
  const list = q.missing.map((c) => `${c} = ${languages[c].swedishName}`).join(", ");
  return {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: values.niva as Effort, format: betaZodOutputFormat(Output) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: `Frågan (för sammanhang, översätt den inte): ${q.question}\n\nÖversätt den här förklaringen till följande språk (språkkod = språk): ${list}\n\n<forklaring>\n${q.explanation}\n</forklaring>`,
      },
    ],
  };
}

/** Sparar (eller i testläge visar) översättningarna för en fråga. Returnerar antal sparade. */
async function save(q: Work, n: number, translations: z.infer<typeof Output>["translations"]) {
  const rows = translations
    .filter((t) => q.missing.includes(t.language as LanguageCode) && t.text.trim().length > 0)
    .map((t) => ({ question_id: q.id, language: t.language, explanation: t.text.trim(), status: "machine" }));
  const lacking = q.missing.filter((l) => !rows.some((r) => r.language === l));
  if (lacking.length) console.warn(`⚠️  Fråga ${n + 1}: saknar ${lacking.join(", ")} – kör skriptet igen senare.`);

  if (values.test) {
    console.log(`\n${n + 1}. ${q.question}`);
    for (const r of rows) console.log(`   [${r.language}] ${r.explanation}`);
    return 0;
  }
  // Skriver aldrig över en översättning som redan finns (t.ex. en granskad).
  const { error } = await db.from("question_translations").upsert(rows, { onConflict: "question_id,language", ignoreDuplicates: true });
  if (error) fail(`Kunde inte spara: ${error.message}`);
  return rows.length;
}

/** En fråga i taget – svaren kommer direkt. Används för test och små körningar. */
async function runDirect(client: Anthropic, work: Work[], used: { input: number; output: number }) {
  let saved = 0;
  for (const [n, q] of work.entries()) {
    let response;
    try {
      // Reservmodell om Opus avböjer. Finns inte för batchar.
      response = await client.beta.messages.parse({ ...paramsFor(q), betas: [BETA], fallbacks: "default" });
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
    saved += await save(q, n, response.parsed_output.translations);
    if (!values.test) process.stdout.write(`✔ ${n + 1}/${work.length}\r`);
  }
  return saved;
}

/**
 * Alla frågor skickas på en gång som en batch (halva priset). Svaren kommer oftast
 * inom en timme. Skriptet väntar och sparar dem när batchen är klar.
 */
async function runBatch(client: Anthropic, work: Work[], used: { input: number; output: number }) {
  let id = values.hamta;
  if (!id) {
    const batch = await client.beta.messages.batches.create({
      requests: work.map((q) => ({ custom_id: q.id, params: paramsFor(q) })),
    });
    id = batch.id;
    console.log(`📦 Batch skickad: ${id}\n   Om skriptet avbryts, hämta svaren med: npm run oversatt-forklaringar -- --hamta ${id}\n`);
  }
  for (;;) {
    const batch = await client.beta.messages.batches.retrieve(id);
    const c = batch.request_counts;
    const done = c.succeeded + c.errored + c.expired + c.canceled;
    console.log(`⏳ ${new Date().toLocaleTimeString("sv-SE")}: ${done}/${done + c.processing} klara`);
    if (batch.processing_status === "ended") break;
    await new Promise((r) => setTimeout(r, 60_000));
  }

  const index = new Map(work.map((q, n) => [q.id, { q, n }]));
  let saved = 0;
  for await (const item of await client.beta.messages.batches.results(id)) {
    const hit = index.get(item.custom_id);
    if (!hit) continue;
    if (item.result.type !== "succeeded") {
      console.warn(`⚠️  Fråga ${hit.n + 1}: ${item.result.type}. Kör skriptet igen senare.`);
      continue;
    }
    const message = item.result.message;
    used.input += message.usage.input_tokens;
    used.output += message.usage.output_tokens;
    const text = message.content.find((b) => b.type === "text")?.text;
    let parsed: z.infer<typeof Output> | null = null;
    try {
      parsed = text ? Output.parse(JSON.parse(text)) : null;
    } catch {
      parsed = null;
    }
    if (message.stop_reason === "refusal" || !parsed) {
      console.warn(`⚠️  Fråga ${hit.n + 1}: ingen översättning. Hoppar över.`);
      continue;
    }
    saved += await save(hit.q, hit.n, parsed.translations);
  }
  return saved;
}

async function main() {
  const { data: questions, error } = await db
    .from("questions")
    .select("id, question, explanation, question_translations(language)")
    .eq("country", country.code)
    .eq("status", "reviewed");
  if (error) fail(`Kunde inte hämta frågor: ${error.message}`);

  const work: Work[] = (questions ?? [])
    .map((q) => {
      const have = new Set((q.question_translations as { language: string }[]).map((t) => t.language));
      return { id: q.id, question: q.question, explanation: q.explanation, missing: targets.filter((l) => !have.has(l)) };
    })
    .filter((q) => q.missing.length > 0)
    .slice(0, limit);

  if (work.length === 0) {
    console.log("\n✅ Alla granskade frågor har redan förklaringar på de valda språken.\n");
    return;
  }
  const batch = values.batch || Boolean(values.hamta);
  if (batch && values.test) fail("--test och --batch går inte att använda samtidigt.");
  console.log(`\n⏳ Översätter ${work.length} förklaringar (${targets.length} språk)${batch ? " som batch" : ""} …\n`);

  const client = new Anthropic();
  const used = { input: 0, output: 0 };
  const saved = batch ? await runBatch(client, work, used) : await runDirect(client, work, used);

  console.log(values.test ? "\n🧪 Testläge: inget sparades.\n" : `\n✅ ${saved} översättningar sparade som maskinöversatta.\n`);
  // Batchar kostar hälften.
  const dollars = ((used.input * PRICE.input + used.output * PRICE.output) / 1e6) * (batch ? 0.5 : 1);
  console.log(`💰 ${used.input} tokens in, ${used.output} tokens ut ≈ $${dollars.toFixed(2)} för ${work.length} frågor.\n`);
}

main();
