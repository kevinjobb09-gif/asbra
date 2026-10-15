/**
 * SKAPAR EN INLOGGNINGSLÄNK TILL ADMINSIDAN – UTAN MEJL
 *
 * Används när mejlet från Supabase inte kommer fram. Fungerar bara på din
 * dator, eftersom den hemliga nyckeln i .env.local krävs. Länken kan bara
 * användas en gång och slutar gälla efter en timme.
 *
 * Kör:  npm run admin-lank
 */
import { exec } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { parseEmailList } from "../src/lib/env";

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secret = process.env.SUPABASE_SECRET_KEY ?? "";
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const email = parseEmailList(process.env.ADMIN_EMAILS)[0] ?? "";
if (!url || !secret) fail("Supabase-nycklarna saknas i .env.local. Kör först  npm run databas");
if (!email) fail("ADMIN_EMAILS saknas i .env.local.");

async function main() {
  const supabase = createClient(url, secret, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) fail(`Kunde inte skapa länken: ${error?.message ?? "okänt fel"}`);

  // Ge admin riktig tillgång i databasen, så att egna svar och prov sparas när du testar.
  const userId = data.user?.id;
  if (userId) {
    const now = new Date();
    const { data: active } = await supabase
      .from("access_grants")
      .select("id")
      .eq("user_id", userId)
      .gt("expires_at", now.toISOString())
      .limit(1);
    if (!active?.length) {
      const expires = new Date(now);
      expires.setFullYear(expires.getFullYear() + 1);
      const grant = await supabase
        .from("access_grants")
        .insert({ user_id: userId, source: "admin", expires_at: expires.toISOString() });
      if (grant.error) console.warn("Kunde inte ge admin tillgång:", grant.error.message);
      else console.log("✔ Admin har fått tillgång i databasen i ett år.");
    }
  }

  const link = `${site}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=/admin`;

  if (process.argv.includes("--visa")) {
    console.log(`\nInloggningslänk för ${email} (gäller en gång):\n${link}\n`);
  } else {
    // Öppnar länken i din vanliga webbläsare. Sajten måste vara igång (npm run dev).
    const opener = process.platform === "win32" ? `start "" "${link}"` : process.platform === "darwin" ? `open "${link}"` : `xdg-open "${link}"`;
    exec(opener);
    console.log(`\n✅ Inloggningslänken för ${email} öppnas i din webbläsare.\n`);
  }
}

main();
