import type { Metadata } from "next";
import { brand, getCountry } from "@/config";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Om oss" };

export default function AboutPage() {
  const country = getCountry();
  return (
    <LegalPage title={`Om ${brand.name}`} updated="28 oktober 2026">
      <p>
        {brand.name} hjälper dig att förbereda dig inför medborgarskapsprovet i samhällskunskap – på svenska, med
        förklaringar på ditt eget språk.
      </p>

      <h2>Vi är inte en myndighet</h2>
      <p>
        {brand.name} är en privat tjänst och är inte kopplad till {country.unaffiliatedAuthorities.join(" eller ")}.
        Information om det riktiga provet finns hos UHR.
      </p>

      <h2>Så tar vi fram frågorna</h2>
      <ul>
        <li>Frågorna och förklaringarna är egenskrivna och bygger på fakta ur {country.studyMaterial.title}.</li>
        <li>Vi använder AI för att ta fram förslag och översättningar, men varje fråga granskas av en människa mot källan innan den publiceras.</li>
        <li>Varje fråga har en källhänvisning, så att du kan läsa mer.</li>
        <li>Översättningar som inte har granskats av en människa märks tydligt.</li>
        <li>Hittar du ett fel? Tryck på &quot;Rapportera fel&quot; vid frågan, så rättar vi det.</li>
      </ul>

      <h2>Kontakt</h2>
      <p>
        E-post: <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
