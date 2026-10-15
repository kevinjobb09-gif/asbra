/**
 * SKAPA FRÅGEUTKAST MED CLAUDE
 *
 * Du skriver egna anteckningar om ett avsnitt i Sverige i fokus. Skriptet ber
 * Claude föreslå frågor utifrån anteckningarna och sparar dem som UTKAST.
 * Inga utkast visas för användare förrän du har granskat dem på /admin.
 *
 * Exempel:
 *   npm run utkast -- --kapitel 3 --avsnitt "3.2 Riksdagen" --fil anteckningar/kap3-riksdagen.txt
 *   npm run utkast -- --kapitel 3 --avsnitt "3.2 Riksdagen"            (klistra in anteckningar)
 *   npm run utkast -- --kapitel 3 --avsnitt "3.2" --fil x.txt --test   (visa bara, spara inget)
 */
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getCountry } from "../src/config";
import { questionInputSchema } from "../src/lib/questions/schema";
import { shuffleOptions } from "../src/lib/questions/shuffle";

const MODEL = "claude-opus-5-5";

const { values } = parseArgs({
  options: {
    kapitel: { type: "string" },
    avsnitt: { type: "string", default: "" },
    fil: { type: "string" },
    antal: { type: "string", default: "8" },
    land: { type: "string", default: "se" },
    test: { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

const country = getCountry(values.land as "se");
const chapter = Number(values.kapitel);
if (!country.chapters.some((c) => c.number === chapter)) {
  fail(`Ange ett kapitel 1–${country.chapters.length} med --kapitel, t.ex. --kapitel 3`);
}
const count = Math.min(Math.max(Number(values.antal) || 8, 1), 20);
const section = values.avsnitt ?? "";
const sourceReference = `${country.studyMaterial.title}, kapitel ${chapter}${section ? `, avsnitt ${section}` : ""}`;

async function readNotes(): Promise<string> {
  if (values.fil) return readFileSync(values.fil, "utf8");
  console.log("Klistra in dina anteckningar. Skriv KLAR på en egen rad när du är färdig:\n");
  const rl = createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) {
    if (line.trim() === "KLAR") break;
    lines.push(line);
  }
  rl.close();
  return lines.join("\n");
}

// Formatet Claude måste svara i.
const DraftSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correct_index: z.number().int(),
      explanation: z.string(),
      difficulty: z.number().int(),
      question_type: z.enum(["förståelse", "tillämpning", "begrepp", "fakta"]),
      ambiguity_warning: z
        .string()
        .nullable()
        .describe("Varför svaret kan vara tvetydigt eller omtvistat. null om svaret är entydigt."),
      based_on: z.string().describe("Vilken del av anteckningarna frågan bygger på, med egna ord."),
    }),
  ),
});

const SYSTEM_PROMPT = `Du skriver övningsfrågor till en privat övningstjänst inför det svenska medborgarskapsprovet i samhällskunskap. Provet bygger på studiematerialet "${country.studyMaterial.title}". De som övar är vuxna som ofta har svenska som andraspråk.

Du får användarens egna anteckningar om ett avsnitt. Skriv frågor som BARA bygger på fakta i anteckningarna. Lägg inte till fakta som inte står där. Om anteckningarna är för tunna för ${count} bra frågor, skriv färre.

Krav på varje fråga:
- Skriven med helt egna ord. Citera inte anteckningarna eller något studiematerial ordagrant.
- Fyra svarsalternativ med exakt ett rätt svar. De felaktiga alternativen ska vara rimliga men tydligt fel för den som förstått. Använd aldrig "alla ovanstående" eller "inget av ovanstående".
- Enkel och tydlig svenska (ungefär nivå B1): korta meningar, vanliga ord, inga dubbla negationer. Förklara svåra begrepp i förklaringen.
- Förklaringen är 2–4 korta meningar. Den förklarar varför det rätta svaret stämmer och gärna varför ett vanligt felsvar är fel.
- difficulty: 1 = lätt, 2 = medel, 3 = svår.

Variera frågorna. De flesta ska testa förståelse (varför något är som det är, vad ett begrepp betyder, hur något fungerar i praktiken) och tillämpning (vad som gäller i en vardaglig situation). Bara en mindre del får vara rena detaljfrågor som årtal och antal.

Var ärlig om osäkerhet: fyll i ambiguity_warning om svaret kan bero på tolkning, om det finns undantag, om fakta kan ha ändrats eller om anteckningarna är otydliga. Annars null.`;

async function main() {
  const notes = (await readNotes()).trim();
  if (notes.length < 50) fail("Anteckningarna är för korta. Skriv minst några meningar.");

  console.log(`\n⏳ Ber Claude om ${count} frågor för ${sourceReference} …`);
  const client = new Anthropic();

  let response;
  try {
    response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Om modellen avböjer används automatiskt en reservmodell.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: betaZodOutputFormat(DraftSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Kapitel ${chapter}${section ? `, avsnitt ${section}` : ""}. Skriv ${count} frågor.\n\n<anteckningar>\n${notes}\n</anteckningar>`,
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) fail("ANTHROPIC_API_KEY saknas eller är fel i .env.local.");
    if (error instanceof Anthropic.RateLimitError) fail("För många anrop just nu. Vänta en minut och försök igen.");
    if (error instanceof Anthropic.APIError) fail(`Claude API svarade med fel ${error.status}: ${error.message}`);
    throw error;
  }

  if (response.stop_reason === "refusal") fail("Claude avböjde förfrågan. Prova att formulera anteckningarna annorlunda.");
  if (response.stop_reason === "max_tokens") fail("Svaret blev för långt. Prova med färre frågor (--antal).");
  const drafts = response.parsed_output?.questions;
  if (!drafts?.length) fail("Claude gav inga frågor tillbaka.");

  // Kontrollera varje fråga med samma regler som adminsidan.
  const rows = [];
  for (const [n, d] of drafts.entries()) {
    const shuffled = shuffleOptions(d.options, d.correct_index);
    const note = [
      `Skapad av Claude (${d.question_type}). Bygger på: ${d.based_on}`,
      d.ambiguity_warning ? `⚠️ MÖJLIGEN TVETYDIG: ${d.ambiguity_warning}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const parsed = questionInputSchema.safeParse({
      country: country.code,
      chapter,
      section,
      question: d.question,
      options: shuffled.options,
      correct_index: shuffled.correctIndex,
      explanation: d.explanation,
      source_reference: sourceReference,
      difficulty: d.difficulty,
      status: "draft",
      review_note: note,
    });
    if (!parsed.success) {
      console.warn(`⚠️  Fråga ${n + 1} hoppades över: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    rows.push(parsed.data);
  }

  for (const [n, r] of rows.entries()) {
    console.log(`\n${n + 1}. ${r.question}`);
    r.options.forEach((o, i) => console.log(`   ${i === r.correct_index ? "✔" : " "} ${"ABCD"[i]}. ${o}`));
    console.log(`   Förklaring: ${r.explanation}`);
    if (r.review_note?.includes("TVETYDIG")) console.log(`   ${r.review_note.split("\n").pop()}`);
  }

  if (values.test) {
    console.log(`\n🧪 Testläge: ${rows.length} frågor visades men sparades inte.\n`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SECRET_KEY saknas i .env.local.");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("questions").insert(rows);
  if (error) fail(`Kunde inte spara i databasen: ${error.message}`);

  console.log(`\n✅ ${rows.length} utkast sparade. Granska dem på /admin innan de publiceras.\n`);
}

main();
