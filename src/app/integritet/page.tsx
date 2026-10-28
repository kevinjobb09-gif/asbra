import type { Metadata } from "next";
import { brand, sellerDetails } from "@/config";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Integritetspolicy" };

/*
 * UTKAST – låt gärna en jurist läsa igenom innan lansering.
 * Kontrollera att listan över tjänster (personuppgiftsbiträden) stämmer.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Integritetspolicy" updated="28 oktober 2026">
      <p>
        Vi samlar bara in det som behövs: din e-postadress, vad du har övat på och – om du säger ja – att du vill ha tips och
        erbjudanden. Vi säljer eller lämnar aldrig ut e-postadresser och använder ingen spårning för annonser.
      </p>

      <h2>Personuppgiftsansvarig</h2>
      <p>
        {sellerDetails()}. E-post:{" "}
        <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
      </p>

      <h2>Vilka uppgifter vi behandlar och varför</h2>
      <ul>
        <li>
          <strong>Övningsdata</strong> (dina svar, provresultat och felrapporter) – för att visa resultat, framsteg och
          repetera fel. Laglig grund: avtal. Övar du utan konto kopplas datan till en anonym identitet i din webbläsare.
        </li>
        <li>
          <strong>E-postadress före gratisfrågorna</strong> – du behöver skriva din e-postadress för att börja öva gratis.
          Vi kopplar den till din anonyma identitet för att ge en gratisomgång per person (så att gratisövningen inte
          missbrukas) och för att fylla i den åt dig om du köper. Vi skickar inga erbjudanden till adressen om du inte har
          kryssat i rutan för det. Laglig grund: berättigat intresse – vi sparar bara adressen, språket och datumet, och
          raderar dem efter högst 12 månader. Du kan invända mot behandlingen genom att mejla oss eller radera dina uppgifter
          på sidan Konto.
        </li>
        <li>
          <strong>E-postadress vid köp</strong> – för att skapa ditt konto, skicka kvitto och inloggningslänkar. Laglig
          grund: avtal.
        </li>
        <li>
          <strong>E-postlistan (tips och erbjudanden)</strong> – om du kryssar i rutan före gratisfrågorna eller skriver upp
          dig på sidan Rabatt sparar vi din e-postadress, ditt språk, din rabattkod och när du gav ditt samtycke. Vi
          använder dem för att skicka koden och tips och erbjudanden om Medborgarhjälpen via e-post. Samtycket är frivilligt
          och påverkar inte gratisövningen. Laglig grund: samtycke.
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
        <li>gratis – kommer ihåg att du redan har skrivit din e-postadress före gratisfrågorna (1 år).</li>
      </ul>

      <h2>Vilka som hjälper oss (personuppgiftsbiträden)</h2>
      <ul>
        <li>Supabase – databas och inloggning. Data lagras inom EU.</li>
        <li>Stripe – betalningar. Stripe är självständigt ansvarig för betaluppgifter.</li>
        <li>Netlify – driftar webbplatsen.</li>
        <li>Resend – skickar inloggningsmejl, mejl med rabattkoder och erbjudanden. Data lagras inom EU (Irland). Vi mäter inte om du öppnar mejlen.</li>
      </ul>
      <p>
        Vissa av dessa företag kan överföra uppgifter till länder utanför EU/EES. Det sker då med stöd av EU-kommissionens
        standardavtalsklausuler eller ett beslut om adekvat skyddsnivå.
      </p>

      <h2>Hur länge vi sparar uppgifterna</h2>
      <ul>
        <li>Övningsdata och konto: tills du raderar kontot, eller två år efter att din tillgång har gått ut.</li>
        <li>Köpuppgifter: sju år enligt bokföringslagen (kvittona finns hos Stripe).</li>
        <li>E-postadress före gratisfrågorna: högst 12 månader (raderas automatiskt), eller tills du raderar dina uppgifter.</li>
        <li>E-postlistan: tills du avregistrerar dig eller raderar ditt konto.</li>
      </ul>

      <h2>Avregistrera dig från erbjudanden</h2>
      <p>
        Du har alltid rätt att säga nej till erbjudanden, utan kostnad. Svara på ett mejl från oss eller mejla{" "}
        <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>, så tar vi bort dig från listan direkt. Att
        avregistrera dig påverkar inte din tillgång till tjänsten.
      </p>

      <h2>Dina rättigheter</h2>
      <p>
        Du har rätt att få veta vilka uppgifter vi har om dig, få dem rättade, flyttade eller raderade och att invända mot
        behandlingen. Du kan själv radera ditt konto och all din övningsdata på sidan Konto. Kontakta oss för övriga frågor.
        Är du missnöjd kan du klaga hos Integritetsskyddsmyndigheten (imy.se).
      </p>
    </LegalPage>
  );
}
