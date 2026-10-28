import { BookOpen, Clock, Gift, Languages, RotateCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { brand, formatPrice, getCountry, languages, type LanguageCode } from "@/config";
import { getI18n } from "@/i18n/server";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/welcome";
import { ButtonLink } from "./ButtonLink";
import { JsonLd } from "./JsonLd";
import { publicEnv } from "@/lib/env";
import { hasGuide } from "@/content/guideLanguages";
import { homePath } from "@/lib/seo";
import { latestTestValues } from "@/lib/exam/latestTest";
import { AnswerOption } from "./AnswerOption";
import { Disclaimer } from "./Disclaimer";

/** Språk som visas som exempel på startsidan (de vanligaste). Det valda språket visas alltid först. */
const SHOWCASE: LanguageCode[] = ["ar", "fa", "prs", "ti", "so", "en", "ckb", "ps", "tr", "ru", "uk", "th"];

/** Startsidan. Används för / och för språksidorna (/ar, /fa …). */
export async function HomeContent({ lang: langOverride }: { lang?: LanguageCode }) {
  const { t, lang } = await getI18n(langOverride);
  const country = getCountry();
  const { exam, freeQuestionLimit, chapters } = country;
  const latest = latestTestValues(lang);
  const material = country.studyMaterial.title;
  const site = publicEnv.siteUrl.replace(/\/$/, "");
  const faq: [string, string][] = [
    [t("home.faqOfficialQ"), t("home.faqOfficialA", { brand: brand.name })],
    [t("home.faqLanguageQ"), t("home.faqLanguageA")],
    [t("home.faqAccountQ"), t("home.faqAccountA")],
    [t("home.faqCancelQ"), t("home.faqCancelA")],
    [
      t("home.faqFormatQ"),
      [latest && t("home.faqFormatLatest", latest), t("home.faqFormatA", { q: exam.questionCount, m: exam.durationMinutes })]
        .filter(Boolean)
        .join(" "),
    ],
  ];
  const showcase = [lang, ...SHOWCASE.filter((c) => c !== lang)].filter((c) => c !== "sv").slice(0, 9);

  return (
    <div className="mx-auto max-w-3xl px-4">
      <section className="pt-10 pb-8 text-center sm:pt-16">
        <p className="mb-3 inline-block rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          {t("home.badge")}
        </p>
        <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-5xl">
          {t("home.titleStart")} <span className="text-primary">{t("home.titleHighlight")}</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t("home.subtitle")}</p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <ButtonLink href="/ova/gratis" size="lg" className="w-full max-w-sm">
            {t("home.ctaFree")}
          </ButtonLink>
          <p className="text-sm text-muted">{t("home.noAccount", { n: freeQuestionLimit })}</p>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-sm font-medium text-muted">
            {t("home.explanationsIn", { n: country.explanationLanguages.length })}
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {showcase.map((code) => (
              <li
                key={code}
                lang={languages[code].htmlLang}
                dir={languages[code].dir}
                className="rounded-full border border-line bg-surface px-3 py-1 text-sm"
              >
                {languages[code].nativeName}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label={t("home.demoTitle")} className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-sm font-semibold text-muted">{t("home.demoTitle")}</p>
        <div aria-hidden className="mt-3 h-4 w-4/5 rounded bg-line" />
        <div aria-hidden className="mt-2 mb-4 h-4 w-3/5 rounded bg-line" />
        <div className="space-y-2" aria-hidden>
          <AnswerOption index={0} text={t("home.demoOptionA")} state="dimmed" disabled />
          <AnswerOption index={1} text={t("home.demoCorrect")} state="correct" disabled />
          <AnswerOption index={2} text={t("home.demoOptionC")} state="dimmed" disabled />
        </div>
        <p className="mt-4 rounded-2xl bg-primary-soft p-4 text-sm">
          <strong>{t("home.demoExplanationLabel")}</strong> {t("home.demoExplanation", { material })}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-center text-2xl font-extrabold">{t("home.featuresTitle")}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          <Feature icon={<BookOpen />} title={t("home.featureChaptersTitle")}>
            {t("home.featureChaptersText", { n: chapters.length, material })}
          </Feature>
          <Feature icon={<Clock />} title={t("home.featureExamTitle")}>
            {t("home.featureExamText", { q: exam.questionCount, m: exam.durationMinutes })}
          </Feature>
          <Feature icon={<RotateCcw />} title={t("home.featureReviewTitle")}>
            {t("home.featureReviewText")}
          </Feature>
          <Feature icon={<TrendingUp />} title={t("home.featureProgressTitle")}>
            {t("home.featureProgressText")}
          </Feature>
          <Feature icon={<Languages />} title={t("home.featureLanguageTitle")}>
            {t("home.featureLanguageText")}
          </Feature>
          <Feature icon={<ShieldCheck />} title={t("home.featureCheckedTitle")}>
            {t("home.featureCheckedText")}
          </Feature>
        </ul>
      </section>

      <section className="mt-12 flex flex-col items-center gap-3 rounded-3xl border-2 border-cta bg-cta-soft p-6 text-center sm:flex-row sm:text-start">
        <Gift className="size-10 shrink-0 text-cta" aria-hidden />
        <div className="flex-1">
          <h2 className="text-xl font-extrabold">{t("welcome.homeTitle", { percent: WELCOME_DISCOUNT_PERCENT })}</h2>
          <p className="text-sm">{t("welcome.homeText")}</p>
        </div>
        <ButtonLink href="/rabatt" className="w-full sm:w-auto">
          {t("welcome.homeCta")}
        </ButtonLink>
      </section>

      <section className="mt-12 rounded-3xl bg-primary p-6 text-center text-white sm:p-10">
        <h2 className="text-2xl font-extrabold">{t("home.priceTitle")}</h2>
        <p className="mt-4 text-5xl font-extrabold">
          <span dir="ltr">{formatPrice(country)}</span> <span className="text-xl font-bold text-white/85">{t("offer.perMonth")}</span>
        </p>
        <p className="mt-2 text-white/85">{t("home.priceText")}</p>
        <ButtonLink href="/ova/gratis" size="lg" className="mt-6 w-full max-w-sm">
          {t("home.priceCta")}
        </ButtonLink>
      </section>

      {hasGuide(lang) && (
        <section className="mt-12 rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xl font-extrabold">{t("home.guideTitle")}</h2>
          <p className="mt-1 text-muted">{t("home.guideText")}</p>
          <ButtonLink href={lang === "sv" ? "/guide" : `/${lang}/guide`} variant="outline" className="mt-4">
            {t("home.guideCta")}
          </ButtonLink>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold">{t("home.faqTitle")}</h2>
        <div className="mt-4 space-y-2">
          {faq.map(([q, a]) => (
            <Faq key={q} q={q}>
              {a}
            </Faq>
          ))}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${site}/#organization`,
              name: brand.name,
              url: site,
              logo: `${site}/icon/512`,
              email: brand.contactEmail,
            },
            {
              "@type": "WebSite",
              "@id": `${site}/#website`,
              name: brand.name,
              url: site,
              inLanguage: languages[lang].htmlLang,
              publisher: { "@id": `${site}/#organization` },
            },
            {
              "@type": "FAQPage",
              url: `${site}${homePath(lang) === "/" ? "" : homePath(lang)}`,
              inLanguage: languages[lang].htmlLang,
              mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
            },
          ],
        }}
      />

      <Disclaimer className="mt-10 text-center" />
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary [&>svg]:size-5">
        {icon}
      </span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted">{children}</p>
      </div>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-4">
      <summary className="cursor-pointer list-none font-semibold marker:hidden">
        <span className="me-2 inline-block text-primary transition-transform group-open:rotate-90 rtl:-scale-x-100">›</span>
        {q}
      </summary>
      <p className="mt-2 text-muted">{children}</p>
    </details>
  );
}
