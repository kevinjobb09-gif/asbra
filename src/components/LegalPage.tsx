import { getI18n } from "@/i18n/server";

/**
 * Ram för juridiska sidor. Texterna finns bara på svenska (den svenska texten gäller),
 * och det sägs tydligt på andra språk.
 */
export async function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const { t, lang } = await getI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {lang !== "sv" && <p className="mb-6 rounded-xl bg-primary-soft p-3 text-sm">{t("legal.swedishOnly")}</p>}
      <article
        lang="sv"
        dir="ltr"
        className="space-y-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:ms-5 [&_li]:list-disc [&_ul]:space-y-1"
      >
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="text-sm text-muted">Senast uppdaterad: {updated}</p>
        {children}
      </article>
    </div>
  );
}
