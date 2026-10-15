"use server";

import { z } from "zod";
import { getI18n } from "@/i18n/server";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { sent: boolean; error?: string };

/** Skickar en inloggningslänk till en kund. Inga nya konton skapas här – konton skapas vid köp. */
export async function sendLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const { t } = await getI18n();
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { sent: false, error: t("buy.errorEmail") };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/konto` },
  });
  // Okänd adress ger också "skickat", så att ingen kan ta reda på vem som är kund.
  if (error && !/not found|signups not allowed|user not found/i.test(error.message)) {
    console.error("Kunde inte skicka inloggningslänk:", error.message);
    return { sent: false, error: t("login.error") };
  }
  return { sent: true };
}
