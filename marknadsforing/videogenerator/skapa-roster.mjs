/**
 * SKAPAR RÖSTKLIPP MED ELEVENLABS – en fil per manusrad
 *
 * Kör:  node marknadsforing/videogenerator/skapa-roster.mjs          (alla språk som stöds)
 *       node marknadsforing/videogenerator/skapa-roster.mjs ar so     (bara vissa språk)
 *
 * Kräver ELEVENLABS_API_KEY i .env.local. Manusen finns i texts.js (window.VOICE).
 * Klipp som redan finns hoppas över – ta bort en fil (eller mappen) för att göra om den.
 * Klippen hamnar i marknadsforing/roster/<språk>/<video>/<rad>.mp3 och används
 * automatiskt av skapa-videor.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "..", "..");
const outDir = path.join(dir, "..", "roster");

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // "Sarah" – kvinnlig, varm och lugn
const MODEL = "eleven_v4";
// Språk som ElevenLabs stödjer. Tigrinja (ti) saknas och får spelas in av en människa.
const SUPPORTED = ["sv", "en", "ar", "fa", "so", "ckb"];

const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const key = (env.match(/^ELEVENLABS_API_KEY=(.*)$/m)?.[1] ?? "").trim();
if (!key) throw new Error("ELEVENLABS_API_KEY saknas i .env.local.");

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(dir, "texts.js"), "utf8"), sandbox);
const VOICE = sandbox.window.VOICE;

const langs = process.argv.slice(2).length ? process.argv.slice(2) : SUPPORTED;
let made = 0, skipped = 0, chars = 0;

for (const lang of langs) {
  if (!SUPPORTED.includes(lang)) {
    console.log(`⏭  ${lang}: stöds inte av ElevenLabs – hoppar över.`);
    continue;
  }
  for (const [video, lines] of Object.entries(VOICE[lang])) {
    const folder = path.join(outDir, lang, video);
    fs.mkdirSync(folder, { recursive: true });
    for (const [i, line] of lines.entries()) {
      const file = path.join(folder, `${i}.mp3`);
      if (fs.existsSync(file)) { skipped++; continue; }
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: line,
          model_id: MODEL,
          language_code: lang,
          // Omgivande rader gör att tonfallet hänger ihop mellan klippen.
          previous_text: lines[i - 1] ?? undefined,
          next_text: lines[i + 1] ?? undefined,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, speed: 1.05 },
        }),
      });
      if (!res.ok) throw new Error(`${lang}/${video}/${i}: ElevenLabs svarade ${res.status} ${(await res.text()).slice(0, 200)}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      made++; chars += line.length;
      process.stdout.write(`✔ ${lang}/${video}/${i}\n`);
    }
  }
}
console.log(`Klart: ${made} nya klipp (${chars} tecken), ${skipped} fanns redan.`);
