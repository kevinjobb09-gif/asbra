/**
 * LANSERING – kopplar domän, nycklar, Stripe-webhook och inloggning med ett kommando
 *
 * Fyll i dessa rader i .env.local och kör:  npm run lansera
 *
 *   NETLIFY_AUTH_TOKEN=nfp_...        (Netlify → User settings → OAuth → New access token)
 *   NETLIFY_SITE_NAME=asbra-prov      (projektets namn på Netlify)
 *   LANSERING_DOMAN=dindoman.se       (domänen du har köpt, utan https://)
 *   STRIPE_LIVE_SECRET_KEY=sk_live_.. (frivillig – utan den används testnyckeln och inga riktiga pengar dras)
 *
 * Skriptet:
 *   1. kopplar domänen till sajten på Netlify (med www som omdirigering och gratis https),
 *   2. skapar Stripe-webhooken för domänen (live om live-nyckeln finns, annars test),
 *   3. lägger in alla nycklar på Netlify,
 *   4. tillåter inloggningslänkar till domänen i Supabase,
 *   5. bygger om sajten.
 * Det kan köras flera gånger – t.ex. först med testnyckeln och sedan igen med live-nyckeln.
 * Inga hemliga värden skrivs ut.
 */

const env = (key: string) => (process.env[key] ?? "").trim();

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

const netlifyToken = env("NETLIFY_AUTH_TOKEN");
const siteName = env("NETLIFY_SITE_NAME") || "asbra-prov";
const domain = env("LANSERING_DOMAN").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase();
const liveKey = env("STRIPE_LIVE_SECRET_KEY");
const stripeKey = liveKey || env("STRIPE_SECRET_KEY");
const supabaseToken = env("SUPABASE_ACCESS_TOKEN");
const supabaseRef = env("SUPABASE_PROJECT_REF");

if (!netlifyToken) fail("NETLIFY_AUTH_TOKEN saknas i .env.local.");
if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) fail("LANSERING_DOMAN saknas eller är ogiltig i .env.local (t.ex. dindoman.se).");
if (!stripeKey) fail("STRIPE_SECRET_KEY saknas i .env.local.");
if (liveKey && !liveKey.startsWith("sk_live_")) fail("STRIPE_LIVE_SECRET_KEY ska börja med sk_live_.");
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "ADMIN_EMAILS"]) {
  if (!env(key)) fail(`${key} saknas i .env.local. Kör först  npm run databas`);
}

const siteUrl = `https://${domain}`;
const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

async function netlify<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.netlify.com/api/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${netlifyToken}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) fail(`Netlify svarade ${res.status} på ${method} ${path}: ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : null) as T;
}

async function stripe<T>(method: string, path: string, form?: [string, string][]): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) fail(`Stripe: ${json.error?.message ?? res.status}`);
  return json as T;
}

type Site = { id: string; name: string; account_id: string; custom_domain: string | null; ssl_url: string };

async function main() {
  console.log(`\nLanserar på ${siteUrl} (${liveKey ? "LIVE – riktiga betalningar" : "testläge – inga riktiga pengar"})\n`);

  // 1. Domänen på Netlify.
  const sites = await netlify<Site[]>("GET", "sites?filter=all&per_page=100");
  const site = sites.find((s) => s.name === siteName);
  if (!site) fail(`Hittar inget Netlify-projekt som heter ${siteName}. Ändra NETLIFY_SITE_NAME.`);
  await netlify("PATCH", `sites/${site.id}`, { custom_domain: domain, domain_aliases: [`www.${domain}`], force_ssl: true });
  console.log(`✅ Domänen ${domain} (och www.${domain}) är kopplad till ${site.name}.`);

  // 2. Stripe-webhooken (en ny hemlighet varje gång – den gamla för samma adress tas bort).
  const account = await stripe<{ settings?: { dashboard?: { display_name?: string } } }>("GET", "account");
  const webhookUrl = `${siteUrl}/api/stripe/webhook`;
  const existing = await stripe<{ data: { id: string; url: string }[] }>("GET", "webhook_endpoints?limit=100");
  for (const w of existing.data.filter((w) => w.url === webhookUrl)) await stripe("DELETE", `webhook_endpoints/${w.id}`);
  const endpoint = await stripe<{ id: string; secret: string }>("POST", "webhook_endpoints", [
    ["url", webhookUrl],
    ["description", "Prenumerationer"],
    ...WEBHOOK_EVENTS.map((e): [string, string] => ["enabled_events[]", e]),
  ]);
  console.log(`✅ Stripe-webhook skapad i kontot ”${account.settings?.dashboard?.display_name ?? "?"}”.`);

  // 3. Nycklarna på Netlify.
  const vars: Record<string, string> = {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_SUPABASE_URL: env("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    SUPABASE_SECRET_KEY: env("SUPABASE_SECRET_KEY"),
    ADMIN_EMAILS: env("ADMIN_EMAILS"),
    STRIPE_SECRET_KEY: stripeKey,
    STRIPE_WEBHOOK_SECRET: endpoint.secret,
  };
  const envPath = `accounts/${site.account_id}/env`;
  const current = await netlify<{ key: string }[]>("GET", `${envPath}?site_id=${site.id}`);
  for (const v of current.filter((v) => v.key in vars)) await netlify("DELETE", `${envPath}/${v.key}?site_id=${site.id}`);
  await netlify(
    "POST",
    `${envPath}?site_id=${site.id}`,
    Object.entries(vars).map(([key, value]) => ({
      key,
      scopes: ["builds", "functions", "runtime"],
      values: [{ value, context: "all" }],
    })),
  );
  console.log(`✅ ${Object.keys(vars).length} nycklar inlagda på Netlify.`);

  // 4. Inloggningslänkar i Supabase.
  if (supabaseToken && supabaseRef) {
    const api = `https://api.supabase.com/v1/projects/${supabaseRef}/config/auth`;
    const headers = { Authorization: `Bearer ${supabaseToken}`, "Content-Type": "application/json" };
    const auth = (await (await fetch(api, { headers })).json()) as { uri_allow_list?: string | null };
    const allow = new Set((auth.uri_allow_list ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    allow.add(`${siteUrl}/**`);
    allow.add(`https://www.${domain}/**`);
    allow.add("http://localhost:3000/**");
    const res = await fetch(api, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ site_url: siteUrl, uri_allow_list: [...allow].join(",") }),
    });
    if (!res.ok) fail(`Supabase svarade ${res.status}: ${(await res.text()).slice(0, 200)}`);
    console.log("✅ Supabase tillåter inloggningslänkar till domänen.");
  } else {
    console.log("⚠️  SUPABASE_ACCESS_TOKEN saknas – lägg till domänen i Supabase under Authentication → URL Configuration.");
  }

  // 5. Bygg om.
  await netlify("POST", `sites/${site.id}/builds`, { clear_cache: true });
  console.log("✅ Netlify bygger om sajten (tar ungefär en minut).");

  console.log(`
Kvar för dig hos domänleverantören (DNS-inställningar), om du inte redan har gjort det:
  • Typ A      namn @     värde 75.2.60.5
  • Typ CNAME  namn www   värde ${site.name}.netlify.app
Det kan ta upp till några timmar innan domänen och https fungerar.
`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
