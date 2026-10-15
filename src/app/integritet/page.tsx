import type { Metadata } from "next";
import { brand } from "@/config";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Integritetspolicy" };

/*
 * UTKAST – låt gärna en jurist läsa igenom innan lansering.
 * Kontrollera att listan över tjänster (personuppgiftsbiträden) stämmer.
 */
export default function PrivacyPage() {
  const { company } = brand;
  return (
    <LegalPage title="Integritetspolicy" updated="[DATUM]">
      <p>
        Vi samlar bara in det som behövs för att tjänsten ska fungera: din e-postadress och vad du har övat på. Vi säljer
        aldrig dina uppgifter och använder ingen spårning för annonser.
      </p>

      <h2>Personuppgiftsansvarig</h2>
      <p>
        {company.legalName}, organisationsnummer {company.orgNumber}, {company.address}. E-post:{" "}
        <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
      </p>

      <h2>Vilka uppgifter vi behandlar och varför</h2>
      <ul>
        <li>
          <strong>Övningsdata</strong> (dina svar, provresultat och felrapporter) – för att visa resultat, framsteg och
          repetera fel. Laglig grund: avtal. Övar du utan konto kopplas datan till en anonym identitet i din webbläsare.
        </li>
        <li>
          <strong>E-postadress</strong> – när du köper, för att skapa ditt konto, skicka kvitto och inloggningslänkar.
          Laglig grund: avtal.
        </li>
        <li>
          <strong>Köpuppgifter</strong> (belopp, datum, ev. rabattkod och att du har godkänt villkoren) – för att
          leverera tjänsten och för bokföring. Laglig grund: avtal och rättslig förpliktelse.
        </li>
        <li>
          <strong>Statistik</strong> – vi räknar hur många som börjar öva, avslutar gratisövningen, öppnar betalningen
          och betalar. Statistiken innehåller inga personuppgifter: ingen IP-adress, ingen identitet och inga
          spårningscookies.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>Vi använder bara cookies som behövs för tjänsten. Därför frågar vi inte om samtycke.</p>
      <ul>
        <li>Inloggning (Supabase) – håller dig inloggad och kopplar dina svar till dig.</li>
        <li>lang – kommer ihåg vilket språk du har valt (1 år).</li>
        <li>ref – kommer ihåg en rabattkod du kom med via en länk, så att rabatten gäller när du köper (30 dagar).</li>
      </ul>

      <h2>Vilka som hjälper oss (personuppgiftsbiträden)</h2>
      <ul>
        <li>Supabase – databas och inloggning. Data lagras inom EU.</li>
        <li>Stripe – betalningar. Stripe är självständigt ansvarig för betaluppgifter.</li>
        <li>Netlify – driftar webbplatsen.</li>
        <li>[E-POSTTJÄNST] – skickar inloggningsmejl.</li>
      </ul>
      <p>
        Vissa av dessa företag kan överföra uppgifter till länder utanför EU/EES. Det sker då med stöd av EU-kommissionens
        standardavtalsklausuler eller ett beslut om adekvat skyddsnivå.
      </p>

      <h2>Hur länge vi sparar uppgifterna</h2>
      <ul>
        <li>Övningsdata och konto: tills du raderar kontot, eller två år efter att din tillgång har gått ut.</li>
        <li>Köpuppgifter: sju år enligt bokföringslagen (kvittona finns hos Stripe).</li>
      </ul>

      <h2>Dina rättigheter</h2>
      <p>
        Du har rätt att få veta vilka uppgifter vi har om dig, få dem rättade, flyttade eller raderade och att invända mot
        behandlingen. Du kan själv radera ditt konto och all din övningsdata på sidan Konto. Kontakta oss för övriga frågor.
        Är du missnöjd kan du klaga hos Integritetsskyddsmyndigheten (imy.se).
      </p>
    </LegalPage>
  );
}
