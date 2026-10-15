/**
 * STÄLLER IN SUPABASE AUTOMATISKT
 *
 * Kräver bara SUPABASE_ACCESS_TOKEN i .env.local (skapas på
 * supabase.com/dashboard/account/tokens). Skriptet:
 *   1. skapar projektet "asbra" i Stockholm (om det inte redan finns)
 *   2. sparar adress och nycklar i .env.local
 *   3. kör alla databasfiler i supabase/migrations som inte körts än
 *   4. lägger in exempelfrågorna första gången
 *   5. ställer in inloggningsadresserna
 *
 * Kör:  npm run databas
 * Säkert att köra flera gånger. Nycklar skrivs aldrig ut på skärmen.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const API = "https://api.supabase.com";
const ENV_FILE = ".env.local";
const PROJECT_NAME = "asbra";
const REGION = "eu-north-1"; // Stockholm

const { values: args } = parseArgs({
  options: {
    org: { type: "string" },
    "godkann-kostnad": { type: "boolean", default: false },
    "utan-exempel": { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

// ---------- .env.local ----------
function readEnv(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(ENV_FILE)) return map;
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map.set(m[1], m[2].trim());
  }
  return map;
}

/** Sätter ett värde i .env.local utan att röra resten av filen. */
function setEnv(key: string, value: string) {
  const text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  writeFileSync(ENV_FILE, re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`);
}

const env = readEnv();
const token = env.get("SUPABASE_ACCESS_TOKEN") || process.env.SUPABASE_ACCESS_TOKEN;
if (!token) fail("SUPABASE_ACCESS_TOKEN saknas i .env.local. Se instruktionerna.");

// ---------- API ----------
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401) fail("Supabase godkände inte SUPABASE_ACCESS_TOKEN. Skapa en ny token och försök igen.");
    throw new Error(`Supabase svarade ${res.status} på ${method} ${path}: ${text.slice(0, 500)}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

type Org = { id: string; slug?: string; name: string };
type Project = { id: string; ref?: string; name: string; organization_slug?: string; organization_id?: string; status: string };
type ApiKey = { api_key: string | null; type: string | null; name: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function chooseOrg(): Promise<Org & { slug: string }> {
  const orgs = (await api<Org[]>("GET", "/v1/organizations")).map((o) => ({ ...o, slug: o.slug ?? o.id }));
  const wanted = args.org ?? env.get("SUPABASE_ORG_SLUG");
  const org = wanted ? orgs.find((o) => o.slug === wanted || o.id === wanted) : orgs.length === 1 ? orgs[0] : undefined;
  if (!org) {
    console.log("\nDu har flera organisationer i Supabase:");
    for (const o of orgs) console.log(`  ${o.name}  →  --org ${o.slug}`);
    fail("Kör igen och välj organisation, t.ex.  npm run databas -- --org <namn-från-listan>");
  }
  return org;
}

async function ensureProject(): Promise<string> {
  const existingRef = env.get("SUPABASE_PROJECT_REF");
  if (existingRef) {
    console.log(`✔ Använder befintligt projekt (${existingRef}).`);
    return existingRef;
  }

  const org = await chooseOrg();
  const projects = await api<Project[]>("GET", "/v1/projects");
  const found = projects.find(
    (p) => p.name === PROJECT_NAME && [p.organization_slug, p.organization_id].includes(org.slug),
  );
  if (found) {
    const ref = found.ref ?? found.id;
    setEnv("SUPABASE_PROJECT_REF", ref);
    console.log(`✔ Hittade projektet "${PROJECT_NAME}" (${ref}).`);
    return ref;
  }

  const { plan } = await api<{ plan: string }>("GET", `/v1/organizations/${org.slug}`);
  if (plan !== "free" && !args["godkann-kostnad"]) {
    fail(
      `Organisationen "${org.name}" har betalplanen "${plan}". Ett nytt projekt där kostar pengar varje månad.\n` +
        "   Välj en gratisorganisation med --org, eller kör med --godkann-kostnad om du vill betala.",
    );
  }

  const dbPass = randomBytes(24).toString("base64url");
  console.log(`⏳ Skapar projektet "${PROJECT_NAME}" i Stockholm (organisation: ${org.name}, plan: ${plan}) …`);
  let created: Project;
  try {
    created = await api<Project>("POST", "/v1/projects", {
      name: PROJECT_NAME,
      organization_slug: org.slug,
      db_pass: dbPass,
      region_selection: { type: "specific", code: REGION },
    });
  } catch (e) {
    const msg = String(e);
    if (/limit|maximum|free projects/i.test(msg)) {
      fail("Gratisplanen tillåter bara två aktiva projekt. Pausa eller ta bort ett gammalt projekt på supabase.com och försök igen.");
    }
    throw e;
  }
  const ref = created.ref ?? created.id;
  setEnv("SUPABASE_PROJECT_REF", ref);
  setEnv("SUPABASE_DB_PASSWORD", dbPass);
  console.log(`✔ Projektet skapat (${ref}). Databaslösenordet är sparat i .env.local.`);
  return ref;
}

async function waitUntilReady(ref: string) {
  process.stdout.write("⏳ Väntar på att databasen startar (1–3 minuter) ");
  for (let i = 0; i < 90; i++) {
    const p = await api<Project>("GET", `/v1/projects/${ref}`);
    if (p.status === "ACTIVE_HEALTHY") {
      // Tjänsterna behöver ofta några sekunder till efter att statusen blivit klar.
      await sleep(5000);
      console.log("✔");
      return;
    }
    if (["INIT_FAILED", "REMOVED", "INACTIVE"].includes(p.status)) fail(`Projektet har status ${p.status}. Kontrollera det på supabase.com.`);
    process.stdout.write(".");
    await sleep(5000);
  }
  fail("Databasen startade inte i tid. Vänta några minuter och kör npm run databas igen.");
}

async function saveKeys(ref: string) {
  let keys = await api<ApiKey[]>("GET", `/v1/projects/${ref}/api-keys?reveal=true`);
  for (const type of ["publishable", "secret"] as const) {
    if (!keys.some((k) => k.type === type && k.api_key)) {
      await api("POST", `/v1/projects/${ref}/api-keys?reveal=true`, { type, name: `${type}_asbra` });
      keys = await api<ApiKey[]>("GET", `/v1/projects/${ref}/api-keys?reveal=true`);
    }
  }
  const publishable = keys.find((k) => k.type === "publishable" && k.api_key)?.api_key;
  const secret = keys.find((k) => k.type === "secret" && k.api_key)?.api_key;
  if (!publishable || !secret) fail("Kunde inte hämta projektets nycklar.");
  setEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${ref}.supabase.co`);
  setEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishable);
  setEnv("SUPABASE_SECRET_KEY", secret);
  console.log("✔ Adress och nycklar sparade i .env.local.");
}

async function sql(ref: string, query: string) {
  return api<unknown[]>("POST", `/v1/projects/${ref}/database/query`, { query });
}

async function runMigrations(ref: string) {
  // Håller reda på vilka filer som redan körts, i ett schema som inte syns utåt.
  await sql(
    ref,
    `create schema if not exists private;
     create table if not exists private.applied_migrations (name text primary key, applied_at timestamptz not null default now());`,
  );
  const applied = new Set(
    (await sql(ref, "select name from private.applied_migrations;")).map((r) => (r as { name: string }).name),
  );
  const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const content = readFileSync(`supabase/migrations/${file}`, "utf8");
    await sql(ref, `begin;\n${content}\ninsert into private.applied_migrations (name) values ('${file.replace(/'/g, "''")}');\ncommit;`);
    console.log(`✔ Körde ${file}`);
    count++;
  }
  if (!count) console.log("✔ Databasen är redan uppdaterad.");
}

async function seedSamples(ref: string) {
  if (args["utan-exempel"]) return;
  const rows = (await sql(ref, "select count(*)::int as n from public.questions;")) as { n: number }[];
  if (rows[0]?.n > 0) {
    console.log("✔ Det finns redan frågor – exempelfrågorna läggs inte in igen.");
    return;
  }
  await sql(ref, readFileSync("supabase/seed/exempelfragor.sql", "utf8"));
  console.log("✔ 10 exempelfrågor inlagda som utkast.");
}

async function configureAuth(ref: string) {
  const siteUrl = env.get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";
  const current = await api<{ uri_allow_list: string | null }>("GET", `/v1/projects/${ref}/config/auth`);
  const allow = new Set((current.uri_allow_list ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  allow.add("http://localhost:3000/**");
  allow.add(`${siteUrl.replace(/\/$/, "")}/**`);
  await api("PATCH", `/v1/projects/${ref}/config/auth`, {
    site_url: siteUrl,
    uri_allow_list: [...allow].join(","),
    // Besökare får en anonym inloggning så att de kan öva utan konto.
    external_anonymous_users_enabled: true,
  });
  console.log(`✔ Inloggningen inställd (${siteUrl}).`);
}

async function main() {
  const ref = await ensureProject();
  await waitUntilReady(ref);
  await saveKeys(ref);
  await runMigrations(ref);
  await seedSamples(ref);
  await configureAuth(ref);
  console.log(`\n✅ Supabase är klart. Se projektet på https://supabase.com/dashboard/project/${ref}\n`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
