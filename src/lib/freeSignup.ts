import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * E-POST FÖRE GRATISFRÅGORNA
 * Besökaren skriver sin e-post innan gratisövningen börjar. Adressen sparas i free_signups
 * (kopplad till den anonyma användaren) och används för gratisövningen och för att fylla
 * i e-postfältet vid köp. Erbjudanden får bara gå till dem som kryssar i samtyckesrutan –
 * de skrivs också upp på e-postlistan (email_signups). Samtycket får aldrig vara ett villkor
 * för att få öva gratis (marknadsföringslagen 19 §, GDPR art. 7.4).
 */

/** Cookie som visar att besökaren redan har skrivit sin e-post (så att rutan inte visas igen). */
export const FREE_GATE_COOKIE = "gratis";
export const FREE_GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type GateForm = { email: string; validEmail: boolean; isBot: boolean; consent: boolean };

/** Läser formuläret: e-post (gemener), robotfälla och den frivilliga samtyckesrutan. */
export function parseGateForm(formData: FormData): GateForm {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  return {
    email,
    validEmail: email.length <= 320 && z.email().safeParse(email).success,
    isBot: String(formData.get("website") ?? "") !== "",
    consent: formData.get("consent_marketing") === "on",
  };
}

type GateInput = {
  preview: boolean;
  isAdmin: boolean;
  hasFullAccess: boolean;
  user: { isAnonymous: boolean; email: string | null } | null;
  hasCookie: boolean;
  hasSignup: boolean;
};

/** Ska e-postrutan visas före gratisfrågorna? Inte för admin, kunder eller den som redan har skrivit sin e-post. */
export function needsEmailGate(input: GateInput): boolean {
  if (input.preview || input.isAdmin || input.hasFullAccess) return false;
  if (input.user && (!input.user.isAnonymous || input.user.email)) return false;
  return !input.hasCookie && !input.hasSignup;
}

/**
 * Sparar adressen. Skrivs samma adress igen uppdateras kopplingen och datumet,
 * så att gallringen (12 månader) räknas från senaste gången.
 */
export async function saveFreeSignup(email: string, userId: string | null, language: string) {
  const { error } = await createAdminClient()
    .from("free_signups")
    .upsert(
      { email, language, created_at: new Date().toISOString(), ...(userId ? { user_id: userId } : {}) },
      { onConflict: "email" },
    );
  if (error) throw new Error(`Kunde inte spara e-postadressen: ${error.message}`);
}

/**
 * En gratisomgång per e-postadress: har adressen redan använts av en annan (anonym) användare
 * som har svarat på alla gratisfrågor, får den inte starta en ny omgång.
 */
export async function hasUsedFreeRoundElsewhere(email: string, userId: string | null, limit: number): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db.from("free_signups").select("user_id").eq("email", email).maybeSingle();
  if (!data?.user_id || data.user_id === userId) return false;
  const { count } = await db
    .from("answers")
    .select("question_id", { count: "exact", head: true })
    .eq("user_id", data.user_id)
    .eq("mode", "free");
  return (count ?? 0) >= limit;
}

/** Adressen som den här (anonyma) användaren skrev före gratisfrågorna, om någon. */
export async function getFreeSignupEmail(userId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("free_signups")
    .select("email")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.email ?? null;
}

/** Tar bort adressen (när kontot raderas). Anonyma användares rader försvinner automatiskt med användaren. */
export async function forgetFreeSignup(email: string) {
  await createAdminClient().from("free_signups").delete().eq("email", email.toLowerCase());
}
