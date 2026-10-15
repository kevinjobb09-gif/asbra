/**
 * ÖVERSÄTT GRÄNSSNITTET MED CLAUDE
 *
 * Läser de svenska texterna i src/i18n/messages/sv.ts och fyller i det som
 * saknas i övriga språkfiler (src/i18n/messages/<språk>.json).
 * Kör det när du har lagt till eller ändrat en text i sv.ts.
 *
 *   npm run oversatt-granssnitt                         (fyller i saknade texter i alla språk)
 *   npm run oversatt-granssnitt -- --sprak ar,fa
 *   npm run oversatt-granssnitt -- --nyckel home.title  (översätt om en ändrad text i alla språk)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { brand, languages, LANGUAGE_CODES, type LanguageCode } from "../src/config";
import { sv } from "../src/i18n/messages/sv";

const MODEL = "claude-opus-5-5";
const DIR = "src/i18n/messages";

const { values } = parseArgs({ options: { sprak: { type: "string" }, nyckel: { type: "string", multiple: true } } });

type Tree = { [k: string]: string | Tree };

function flatten(obj: Tree, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flatten(v, `${prefix}${k}.`)))),
  );
}

function unflatten(flat: Record<string, string>): Tree {
  const root: Tree = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let node = root;
    for (const p of parts.slice(0, -1)) node = (node[p] ??= {}) as Tree;
    node[parts.at(-1)!] = value;
  }
  return root;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const source = flatten(sv as unknown as Tree);
const targets = (values.sprak ? values.sprak.split(",") : LANGUAGE_CODES.filter((c) => c !== "sv")).filter(
  (c): c is LanguageCode => (LANGUAGE_CODES as readonly string[]).includes(c) && c !== "sv",
);

const SYSTEM = `Du översätter texterna i gränssnittet för ${brand.name}, en mobilapp där vuxna övar inför det svenska medborgarskapsprovet. Många användare har begränsad skolbakgrund.

Regler:
- Skriv kort, vänligt och mycket enkelt. Använd "du"-tilltal om språket har det.
- Behåll {platshållare} exakt som de är, t.ex. {n}, {price}, {brand}.
- Behåll namnen ${brand.name}, UHR, Migrationsverket, Stripe och "Sverige i fokus" oöversatta.
- "Provet" är det svenska medborgarskapsprovet i samhällskunskap.
- Dari (prs) är afghansk dari. Kurmanji (kmr) skrivs med latinska bokstäver.
- Svara med en lista där varje nyckel får sin översättning.`;

const Output = z.object({ items: z.array(z.object({ key: z.string(), text: z.string() })) });

async function main() {
  const client = new Anthropic();
  for (const lang of targets) {
    const file = `${DIR}/${lang}.json`;
    const current: Record<string, string> = existsSync(file) ? flatten(JSON.parse(readFileSync(file, "utf8"))) : {};
    const todo = Object.keys(source).filter((k) => !current[k]?.trim() || values.nyckel?.includes(k));
    if (todo.length === 0) {
      console.log(`✔ ${lang}: inget att översätta`);
      continue;
    }
    const input = todo.map((k) => `${k}: ${source[k]}`).join("\n");
    const res = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Output) },
      system: SYSTEM,
      messages: [{ role: "user", content: `Översätt till ${languages[lang].swedishName} (${lang}):\n\n${input}` }],
    });
    const items = res.parsed_output?.items ?? [];
    let ok = 0;
    for (const { key, text } of items) {
      if (!(key in source)) continue;
      if (placeholders(text) !== placeholders(source[key])) {
        console.warn(`⚠️  ${lang} ${key}: platshållarna stämmer inte – hoppar över`);
        continue;
      }
      current[key] = text.trim();
      ok++;
    }
    // Spara i samma ordning som den svenska filen.
    const ordered = Object.fromEntries(Object.keys(source).filter((k) => current[k]).map((k) => [k, current[k]]));
    writeFileSync(file, `${JSON.stringify(unflatten(ordered), null, 2)}\n`);
    console.log(`✔ ${lang}: ${ok}/${todo.length} texter översatta`);
  }
  console.log("\nKör  npm test  för att kontrollera att alla språkfiler är kompletta.\n");
}

main();
