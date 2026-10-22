import type { Metadata } from "next";
import { brand, formatPrice, getCountry } from "@/config";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Användarvillkor" };

/*
 * UTKAST – låt gärna en jurist läsa igenom innan lansering.
 * Företagsuppgifterna hämtas från src/config/brand.ts.
 */
export default function TermsPage() {
  const country = getCountry();
  const { company } = brand;
  return (
    <LegalPage title="Användarvillkor" updated="[DATUM]">
      <h2>1. Om tjänsten</h2>
      <p>
        {brand.name} är en digital övningstjänst inför medborgarskapsprovet i samhällskunskap. Tjänsten tillhandahålls av{" "}
        {company.legalName}, organisationsnummer {company.orgNumber}, {company.address} (&quot;vi&quot;).
      </p>
      <p>
        {brand.name} är en privat tjänst och är inte kopplad till {country.unaffiliatedAuthorities.join(" eller ")}.
        Frågorna är egenskrivna och bygger på fakta ur studiematerialet {country.studyMaterial.title}. De är inte frågor
        från det riktiga provet. Vi lovar inte att du blir godkänd på provet.
      </p>

      <h2>2. Gratis och prenumeration</h2>
      <p>
        Du kan öva på ett begränsat antal frågor gratis utan konto. Allt innehåll får du med en månadsprenumeration för{" "}
        {formatPrice(country)} i månaden (inklusive moms). Prenumerationen förnyas automatiskt varje månad tills du säger upp
        den. Har du kommit via en rabattkod gäller rabatten den första månaden.
      </p>

      <h2>3. Ingen bindningstid – säg upp när du vill</h2>
      <ul>
        <li>Det finns ingen bindningstid och ingen uppsägningstid.</li>
        <li>Du säger upp med ett klick under <strong>Konto</strong>, direkt och utan extra kostnad.</li>
        <li>
          <strong>Uppsägningen gäller direkt.</strong> Tillgången till betalinnehållet upphör i samma stund som du säger upp,
          och inga fler betalningar dras. Redan betald tid återbetalas inte.
        </li>
        <li>Raderar du ditt konto avslutas prenumerationen direkt.</li>
      </ul>

      <h2>4. Betalning och ångerrätt</h2>
      <p>
        Betalningen hanteras av Stripe. Vi ser eller sparar aldrig dina kortuppgifter. Kvitto skickas till den e-postadress du
        anger. Tjänsten är digitalt innehåll som levereras direkt. Innan du betalar ber vi dig uttryckligen godkänna att
        leveransen börjar direkt och att du därmed inte har någon ångerrätt (2 kap. 11 § lagen om distansavtal och avtal
        utanför affärslokaler). Du kan ändå alltid säga upp prenumerationen enligt punkt 3. Har tjänsten fel eller fungerar
        den inte gäller dina rättigheter enligt konsumentlagstiftningen – kontakta oss så löser vi det.
      </p>

      <h2>5. Ditt konto</h2>
      <ul>
        <li>Ditt konto skapas när du startar prenumerationen. Du loggar in med en länk som skickas till din e-post.</li>
        <li>Tillgången är personlig och får inte delas eller säljas vidare.</li>
        <li>Du kan när som helst radera ditt konto och all din data på sidan Konto.</li>
      </ul>

      <h2>6. Innehållet</h2>
      <p>
        Frågor, förklaringar, texter och design tillhör oss. Du får använda dem för din egen övning, men inte kopiera,
        sprida eller sälja dem. Vi gör vårt bästa för att innehållet ska vara korrekt och granskar varje fråga innan den
        publiceras. Översättningar av förklaringar kan vara gjorda med AI och märks då. Hittar du ett fel – använd knappen
        &quot;Rapportera fel&quot;.
      </p>

      <h2>7. Ansvar</h2>
      <p>
        Tjänsten är ett övningsverktyg. Vi ansvarar inte för resultatet på provet eller för beslut i ditt
        medborgarskapsärende. Vårt ansvar är begränsat till det belopp du har betalat den senaste månaden, utom vid grov vårdslöshet eller
        där lag säger annat.
      </p>

      <h2>8. Ändringar</h2>
      <p>
        Vi kan uppdatera villkoren. Viktiga ändringar meddelar vi på webbplatsen. Ändringar påverkar inte en tillgång du
        redan har betalat för. Vid prisändring meddelar vi dig i förväg och du kan säga upp innan det nya priset gäller.
      </p>

      <h2>9. Tvister och lag</h2>
      <p>
        Svensk lag gäller. Kontakta oss först om du är missnöjd. Du kan också vända dig till Allmänna reklamationsnämnden
        (arn.se) eller EU:s plattform för tvistlösning online.
      </p>

      <h2>10. Kontakt</h2>
      <p>
        {company.legalName}, {company.address}. E-post: <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
