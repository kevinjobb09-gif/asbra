import type { Metadata } from "next";
import { brand } from "@/config";
import { getI18n } from "@/i18n/server";
import { CopyEmail } from "./CopyEmail";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("contact.title") };
}

/**
 * Kontaktsidan. Adressen visas i klartext, eftersom en mejllänk inte gör något
 * på datorer som saknar ett e-postprogram.
 */
export default async function ContactPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <h1 className="text-3xl font-extrabold">{t("contact.title")}</h1>
      <p className="text-lg">{t("contact.text")}</p>
      <div className="space-y-4 rounded-3xl border border-line bg-surface p-6">
        <p dir="ltr" className="break-all text-center text-xl font-bold select-all">
          {brand.contactEmail}
        </p>
        <CopyEmail email={brand.contactEmail} />
      </div>
    </div>
  );
}
