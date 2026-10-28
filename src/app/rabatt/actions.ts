"use server";

import { z } from "zod";
import { getI18n } from "@/i18n/server";
import { joinMailingList } from "@/lib/welcome";

export type SignupState = {
  error?: string;
  email?: string;
  code?: string;
  percent?: number;
  used?: boolean;
  emailed?: boolean;
};

export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const { t, lang } = await getI18n();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Fälla för robotar: fältet är dolt för människor.
  if (String(formData.get("website") ?? "") !== "") return {};
  if (!z.email().safeParse(email).success) return { error: t("buy.errorEmail"), email };
  if (formData.get("consent_marketing") !== "on") return { error: t("welcome.errorConsent"), email };

  try {
    const result = await joinMailingList(email, lang, t);
    if (result.used) return { email, used: true };
    return { email, code: result.code, percent: result.discountPercent, emailed: result.emailed };
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return { error: t("welcome.error"), email };
  }
}
