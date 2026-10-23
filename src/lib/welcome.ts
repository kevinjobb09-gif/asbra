import "server-only";
import { randomBytes } from "node:crypto";
import { brand } from "@/config";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * VÄLKOMSTRABATT
 * Den som skriver upp sig med sin e-post får en personlig kod. Koden gäller bara
 * med samma e-postadress och kan användas en gång (märks som använd när köpet är betalt).
 */

export { WELCOME_DISCOUNT_PERCENT } from "@/lib/payments/pricing";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/payments/pricing";

export type WelcomeCode = { code: string; email: string; discountPercent: number; used: boolean };

function newCode() {
  return `valkommen-${randomBytes(4).toString("hex")}`;
}

/**
 * Samma inkorg kan skrivas på flera sätt: "namn+rabatt@gmail.com" och "n.amn@gmail.com"
 * hamnar hos "namn@gmail.com". Används för att avgöra om koden används av rätt person.
 */
export function mailboxKey(email: string): string {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const base = local.split("+")[0];
  const gmail = domain === "gmail.com" || domain === "googlemail.com";
  return `${gmail ? base.replace(/\./g, "") : base}@${gmail ? "gmail.com" : domain}`;
}

export function normalizeWelcomeCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toLowerCase();
  return /^[a-z0-9-]{4,40}$/.test(code) ? code : null;
}

/** Hämtar eller skapar koden för en e-postadress. */
export async function signUpForWelcomeCode(email: string, language: string) {
  const db = createAdminClient();
  const { data: existing } = await db
    .from("email_signups")
    .select("code, discount_percent, used_at")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return { code: existing.code, discountPercent: existing.discount_percent, used: existing.used_at !== null, isNew: false };
  }
  const code = newCode();
  const { error } = await db.from("email_signups").insert({
    email,
    code,
    discount_percent: WELCOME_DISCOUNT_PERCENT,
    language,
    marketing_consent_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Kunde inte spara e-postadressen: ${error.message}`);
  return { code, discountPercent: WELCOME_DISCOUNT_PERCENT, used: false, isNew: true };
}

export async function getWelcomeCode(code: string): Promise<WelcomeCode | null> {
  const { data } = await createAdminClient()
    .from("email_signups")
    .select("code, email, discount_percent, used_at")
    .eq("code", code)
    .maybeSingle();
  return data ? { code: data.code, email: data.email, discountPercent: data.discount_percent, used: data.used_at !== null } : null;
}

/** Märker koden som använd när köpet är betalt. Görs bara en gång. */
export async function markWelcomeCodeUsed(purchaseId: string, userId: string) {
  const db = createAdminClient();
  const { data } = await db.from("purchases").select("welcome_code").eq("id", purchaseId).maybeSingle();
  if (!data?.welcome_code) return;
  await db
    .from("email_signups")
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq("code", data.welcome_code)
    .is("used_at", null);
}

/** Tar bort e-postadressen från listan (när kontot raderas). */
export async function forgetSignup(email: string) {
  await createAdminClient().from("email_signups").delete().eq("email", email.toLowerCase());
}

export function welcomeLink(code: string) {
  return `${publicEnv.siteUrl.replace(/\/$/, "")}/kop?kod=${encodeURIComponent(code)}`;
}

/**
 * Skickar koden via Resend. Returnerar false om e-post inte är inställd eller misslyckas
 * – koden visas ändå på sidan, så inget går förlorat.
 */
export async function sendWelcomeEmail(to: string, texts: { subject: string; body: string; footer: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const domain = new URL(publicEnv.siteUrl).hostname.replace(/^www\./, "");
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1b2e;max-width:520px">
<p style="font-size:20px;font-weight:bold;color:#4c2fc8">${escape(brand.name)}</p>
${texts.body
  .split("\n")
  .map((line) => `<p>${escape(line).replace(/(https:\/\/\S+)/g, '<a href="$1" style="color:#4c2fc8">$1</a>')}</p>`)
  .join("\n")}
<p style="font-size:13px;color:#5d5a73">${escape(texts.footer)}</p></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${brand.name} <no-reply@${domain}>`,
        to: [to],
        reply_to: brand.contactEmail,
        subject: texts.subject,
        text: `${texts.body}\n\n${texts.footer}`,
        html,
      }),
    });
    if (!res.ok) console.error("Resend svarade", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("Kunde inte skicka välkomstmejl:", e instanceof Error ? e.message : e);
    return false;
  }
}
