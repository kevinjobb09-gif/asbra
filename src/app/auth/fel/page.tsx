import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { ButtonLink } from "@/components/ButtonLink";

export const metadata: Metadata = { robots: { index: false } };

export default async function AuthErrorPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">{t("login.failedTitle")}</h1>
      <p className="mt-3 text-muted">{t("login.failedText")}</p>
      <ButtonLink href="/logga-in" className="mt-8">
        {t("login.newLink")}
      </ButtonLink>
    </div>
  );
}
