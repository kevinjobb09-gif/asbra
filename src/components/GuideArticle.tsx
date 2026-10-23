import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { brand, getCountry, languages, type LanguageCode } from "@/config";
import { GUIDE_CHECKED, GUIDE_LANGUAGES, GUIDE_LINKS, GUIDES, guidePath } from "@/content/guide";
import { publicEnv } from "@/lib/env";
import { languageAlternates } from "@/lib/seo";
import { ButtonLink } from "./ButtonLink";
import { JsonLd } from "./JsonLd";

export function guideMetadata(lang: LanguageCode): Metadata {
  const guide = GUIDES[lang]!;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: { canonical: guidePath(lang), languages: languageAlternates(guidePath, GUIDE_LANGUAGES) },
    openGraph: { title: guide.metaTitle, description: guide.metaDescription, type: "article" },
  };
}

/** Guiden om medborgarskapsprovet. Texten finns i src/content/guide.ts. */
export function GuideArticle({ lang }: { lang: LanguageCode }) {
  const guide = GUIDES[lang]!;
  const country = getCountry();
  const site = publicEnv.siteUrl.replace(/\/$/, "");
  const { dir, htmlLang } = languages[lang];
  const checked = new Intl.DateTimeFormat(htmlLang, { dateStyle: "long", timeZone: country.timeZone }).format(
    new Date(`${GUIDE_CHECKED}T12:00:00Z`),
  );
  const links = [
    [guide.linkUhr, GUIDE_LINKS.uhr],
    [guide.linkMaterial, GUIDE_LINKS.material],
    [guide.linkAdjustments, GUIDE_LINKS.adjustments],
    [guide.linkMigrationsverket, GUIDE_LINKS.migrationsverket],
  ];

  return (
    <article lang={htmlLang} dir={dir} className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-4xl">{guide.title}</h1>
        <p className="text-lg text-muted">{guide.intro}</p>
      </header>

      {guide.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-2xl font-extrabold">{section.heading}</h2>
          {section.paragraphs?.map((p) => <p key={p} className="leading-relaxed">{p}</p>)}
          {section.bullets && (
            <ul className="list-disc space-y-1.5 ps-6 leading-relaxed">
              {section.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          {section.chapters && (
            <ol lang="sv" dir="ltr" className="list-decimal space-y-1 ps-8 leading-relaxed">
              {country.chapters.map((c) => <li key={c.number}>{c.title}</li>)}
            </ol>
          )}
        </section>
      ))}

      <section className="rounded-3xl bg-primary p-6 text-center text-white">
        <h2 className="text-2xl font-extrabold">{guide.ctaTitle}</h2>
        <p className="mt-2 text-white/85">{guide.ctaText}</p>
        <ButtonLink href="/ova/gratis" size="lg" className="mt-5 w-full max-w-sm">
          {guide.ctaButton}
        </ButtonLink>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-5 text-sm">
        <h2 className="text-lg font-bold">{guide.sourcesTitle}</h2>
        <p className="text-muted">{guide.sourcesText.replace("{date}", checked)}</p>
        <ul className="space-y-1.5">
          {links.map(([label, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline">
                {label} <ExternalLink size={14} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.metaDescription,
          inLanguage: htmlLang,
          dateModified: GUIDE_CHECKED,
          mainEntityOfPage: `${site}${guidePath(lang)}`,
          author: { "@type": "Organization", name: brand.name, url: site },
          publisher: { "@type": "Organization", name: brand.name, logo: { "@type": "ImageObject", url: `${site}/icon/512` } },
          citation: Object.values(GUIDE_LINKS),
        }}
      />
    </article>
  );
}
