"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCountry } from "@/config";
import { getI18n } from "@/i18n/server";
import {
  FREE_GATE_COOKIE,
  FREE_GATE_COOKIE_MAX_AGE,
  hasUsedFreeRoundElsewhere,
  parseGateForm,
  saveFreeSignup,
} from "@/lib/freeSignup";
import { getCurrentUser } from "@/lib/supabase/user";
import { joinMailingList } from "@/lib/welcome";

export type GateState = { error?: string; email?: string; usedUp?: boolean };

/**
 * E-postrutan före gratisfrågorna. Adressen är obligatorisk (en gratisomgång per adress),
 * samtycket till erbjudanden är frivilligt. Den anonyma användaren har skapats i webbläsaren
 * innan formuläret skickas, så adressen kan kopplas till den.
 */
export async function startFreePractice(_prev: GateState, formData: FormData): Promise<GateState> {
  const { t, lang } = await getI18n();
  const form = parseGateForm(formData);

  // Fälla för robotar: fältet är dolt för människor.
  if (form.isBot) return {};
  if (!form.validEmail) return { error: t("buy.errorEmail"), email: form.email };

  let emailed = false;
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    if (await hasUsedFreeRoundElsewhere(form.email, userId, getCountry().freeQuestionLimit)) {
      return { usedUp: true, email: form.email };
    }
    await saveFreeSignup(form.email, userId, lang);
    if (form.consent) emailed = (await joinMailingList(form.email, lang, t)).emailed;
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return { error: t("welcome.error"), email: form.email };
  }

  (await cookies()).set(FREE_GATE_COOKIE, "1", {
    path: "/",
    maxAge: FREE_GATE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  redirect(emailed ? "/ova/gratis?kod=skickad" : "/ova/gratis");
}
