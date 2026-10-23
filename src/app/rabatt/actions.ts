"use server";

import { z } from "zod";
import { brand } from "@/config";
import { getI18n } from "@/i18n/server";
import { sendWelcomeEmail, signUpForWelcomeCode, welcomeLink } from "@/lib/welcome";

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
    const result = await signUpForWelcomeCode(email, lang);
    if (result.used) return { email, used: true };
    const link = welcomeLink(result.code);
    // Mejlet skickas bara första gången, så att formuläret inte kan användas för att spamma.
    const emailed = result.isNew
      ? await sendWelcomeEmail(email, {
          subject: t("welcome.mailSubject", { percent: result.discountPercent }),
          body: t("welcome.mailBody", { code: result.code, percent: result.discountPercent, link }),
          footer: t("welcome.mailFooter", { brand: brand.name }),
        })
      : false;
    return { email, code: result.code, percent: result.discountPercent, emailed };
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return { error: t("welcome.error"), email };
  }
}
