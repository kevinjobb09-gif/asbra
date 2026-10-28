import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getCountry } from "@/config";
import { isCurrentUserAdmin } from "@/lib/admin/auth";
import { getAccess } from "@/lib/access";
import { FREE_GATE_COOKIE, getFreeSignupEmail, needsEmailGate } from "@/lib/freeSignup";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/payments/pricing";
import { getCurrentUser } from "@/lib/supabase/user";
import { getI18n } from "@/i18n/server";
import { getAllQuestionsForPreview, getFreeQuestionPool } from "@/lib/questions/public";
import { FreePractice } from "@/components/practice/FreePractice";
import { EmailGate } from "./EmailGate";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const n = getCountry().freeQuestionLimit;
  return { title: t("seo.freeTitle"), description: t("seo.freeDescription", { n }), alternates: { canonical: "/ova/gratis" } };
}

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ utkast?: string; kod?: string }> };

export default async function FreePracticePage({ searchParams }: Props) {
  const country = getCountry();
  const { t, lang } = await getI18n();
  const params = await searchParams;
  const preview = params.utkast === "1" && (await isCurrentUserAdmin());

  if (!preview) {
    const [user, access, cookieStore] = await Promise.all([getCurrentUser(), getAccess(), cookies()]);
    const hasCookie = cookieStore.get(FREE_GATE_COOKIE)?.value === "1";
    // Databasen kollas bara när kakan saknas men det finns en anonym användare.
    const hasSignup = !hasCookie && !!user?.isAnonymous && !user.email && !!(await getFreeSignupEmail(user.id));
    const gate = needsEmailGate({ preview, isAdmin: access.isAdmin, hasFullAccess: access.hasFullAccess, user, hasCookie, hasSignup });
    if (gate) {
      return (
        <div className="mx-auto max-w-lg px-4 py-8">
          <EmailGate freeCount={country.freeQuestionLimit} discountPercent={WELCOME_DISCOUNT_PERCENT} />
        </div>
      );
    }
  }

  const pool = preview
    ? await getAllQuestionsForPreview(country.code, { lang })
    : await getFreeQuestionPool(country.code, lang);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {preview && (
        <p className="mb-4 rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm font-semibold text-cta-dark" lang="sv" dir="ltr">
          Förhandsvisning för admin: alla frågor (även utkast) visas. Svar sparas inte.
        </p>
      )}
      {params.kod === "skickad" && (
        <p role="status" className="mb-4 rounded-xl bg-primary-soft p-3 text-sm font-semibold">
          {t("freeGate.codeSent", { percent: WELCOME_DISCOUNT_PERCENT })}
        </p>
      )}
      <FreePractice pool={pool} limit={country.freeQuestionLimit} preview={preview} />
    </div>
  );
}
