# NAMN – övning inför medborgarskapsprovet

En webbtjänst där man övar inför delprovet i samhällskunskap för svenskt medborgarskap.
Frågorna visas på svenska och förklaringarna på användarens eget språk.

> **Viktigt:** Tjänsten är privat och inte kopplad till UHR eller Migrationsverket.
> Kontrollera provformatet (antal frågor, tid, godkäntgräns) på [uhr.se](https://www.uhr.se)
> och uppdatera `src/config/countries/se.ts` när något ändras.

## Kom igång lokalt

Du behöver [Node.js](https://nodejs.org) version 20.9 eller senare (du har v24).

```bash
npm install
```

```bash
npm run dev
```

Öppna sedan <http://localhost:3000> i webbläsaren. Sidan uppdateras automatiskt när du sparar en fil.

### Testa i mobilen

1. Datorn och mobilen måste vara på samma wifi.
2. Kör `npm run dev`. I terminalen står en rad som `Network: http://192.168.x.x:3000`.
3. Öppna den adressen i mobilens webbläsare.

I datorns webbläsare kan du också trycka **F12** och klicka på mobilikonen för att se mobilvy.

## Kommandon

> **Windows/PowerShell:** Står det *"running scripts is disabled on this system"*, skriv `npm.cmd` i stället
> för `npm`, till exempel `npm.cmd run dev`. Det fungerar likadant och kräver ingen ändring av säkerhetsinställningar.

| Kommando | Vad det gör |
|---|---|
| `npm run dev` | Startar sajten lokalt för utveckling |
| `npm test` | Kör alla tester en gång |
| `npm run test:watch` | Kör testerna igen varje gång du sparar |
| `npm run lint` | Letar efter vanliga kodfel |
| `npm run typecheck` | Kontrollerar TypeScript-typerna |
| `npm run build` | Bygger sajten som den blir i produktion |
| `npm run databas` | Ställer in Supabase och uppdaterar databasen |
| `npm run utkast -- ...` | Skapar frågeutkast med Claude (se nedan) |
| `npm run oversatt-forklaringar` | Översätter förklaringarna till granskade frågor till alla språk |
| `npm run oversatt-granssnitt` | Översätter nya eller ändrade texter i gränssnittet |
| `npm run admin-lank` | Loggar in dig som admin utan mejl |
| `npm start` | Kör den byggda sajten (efter `npm run build`) |

## Var ändrar jag vad?

| Vill du ändra … | Fil |
|---|---|
| Varumärkesnamnet (NAMN), kontaktadress, företagsuppgifter | `src/config/brand.ts` |
| Provformat, pris, antal gratisfrågor, kapitelnamn, rätt i rad för repetition | `src/config/countries/se.ts` |
| Vilka språk som finns | `src/config/languages.ts` och `explanationLanguages` i `se.ts` |
| Texterna i gränssnittet (svenska) | `src/i18n/messages/sv.ts` – övriga språk i samma mapp (`.json`) |
| Användarvillkor, integritetspolicy, om oss | `src/app/villkor`, `src/app/integritet`, `src/app/om` |
| Färger | `src/app/globals.css` (överst) och `colors` i `brand.ts` |
| Startsidans text | `home` i `src/i18n/messages/sv.ts` |

## Nycklar och hemligheter

1. Kopiera `.env.example` till en ny fil som heter `.env.local`.
2. Fyll i värdena. Där står det var du hittar varje nyckel.
3. Starta om `npm run dev`.

`.env.local` laddas aldrig upp till GitHub. Lägg aldrig nycklar direkt i koden.

## Ställa in Supabase (databas och inloggning)

Allt sköts av ett skript. Det enda du gör själv är att skapa en token:

1. Gå till <https://supabase.com/dashboard/account/tokens> och klicka på **Generate new token**.
2. Klistra in token efter `SUPABASE_ACCESS_TOKEN=` i `.env.local` och spara.
3. Kör:

```bash
npm run databas
```

Skriptet skapar projektet **asbra** i Stockholm, sparar adress och nycklar i `.env.local`, bygger
databasen (filerna i `supabase/migrations`), lägger in exempelfrågorna och ställer in inloggningen.
Det går att köra igen när som helst, till exempel när en ny databasfil har lagts till. Då körs bara de nya filerna.

> Supabase inbyggda e-post kan bara skicka ett fåtal mejl i timmen och är långsam. Det räcker för test,
> men innan lansering behöver du en riktig e-posttjänst (se checklistan längst ner).

### Kontrollera säkerheten

När nycklarna finns i `.env.local` kör `npm test` även databastesterna. De kontrollerar att en
besökare **aldrig** kan se utkast och inte kan ändra frågor.

## Lägga till och granska frågor

### Adminsidan

**Snabbast (utan mejl):** starta sajten och kör `npm.cmd run admin-lank`. Då öppnas en inloggningslänk direkt i din webbläsare.

**Via mejl:**

1. Gå till <http://localhost:3000/admin/logga-in> och skriv din admin-e-post (`ADMIN_EMAILS` i `.env.local`).
2. Klicka på länken i mejlet. Öppna den i **samma webbläsare**.
3. På `/admin` ser du alla frågor per kapitel. Klicka på en fråga för att granska den:
   - Till höger ser du källhänvisningen och hur frågan ser ut för användaren.
   - **Spara som utkast**: frågan syns inte för användare.
   - **Spara och markera som granskad**: frågan blir synlig för användare. Gör det bara när du har
     kontrollerat fakta mot *Sverige i fokus*.
4. En fråga med källan "EXEMPEL …" kan inte markeras som granskad förrän du skrivit in den riktiga källan.

**Gratisfrågor:** bocka i **Gratisfråga** på en granskad fråga för att den ska ingå i gratisläget
(`/ova/gratis`). Varje besökare får 15 gratisfrågor (ändras i `freeQuestionLimit` i `se.ts`), spridda över kapitlen.
Välj gärna minst 30 gratisfrågor från olika kapitel (så att olika besökare får olika frågor). Översikten på `/admin` visar hur många du har.
Övriga granskade frågor kan bara läsas av den som har köpt tillgång. Det skyddet ligger i databasen.

**Testa provsimuleringen:** öppna `/prov?utkast=1&minuter=2` som admin. Då blir provtiden 2 minuter, så att du
kan se att provet lämnas in automatiskt. Vanliga användare får alltid tiden från `se.ts`.

**Förhandsvisa gratisläget:** öppna `/ova/gratis?utkast=1` när du är inloggad som admin.

**Förhandsvisa som användare:** på en fråga i adminsidan, klicka **Förhandsvisa kapitlet som användare**.
Då ser du kapitlet precis som användarna, inklusive utkast (bara du ser utkasten). Svar sparas inte.

⚠️ **De 10 exempelfrågorna är bara testdata.** Ersätt dem med frågor som du själv har granskat.

### Skapa utkast med Claude

1. Lägg din Claude-nyckel i `.env.local` (`ANTHROPIC_API_KEY`, från console.anthropic.com).
2. Skriv egna anteckningar om ett avsnitt i en textfil, t.ex. `anteckningar/kap3-riksdagen.txt`.
   Mappen `anteckningar/` laddas aldrig upp till GitHub. Skriv med egna ord och kopiera inte texten från boken.
3. Kör (`--test` visar frågorna utan att spara dem):

```bash
npm run utkast -- --kapitel 3 --avsnitt "3.2 Riksdagen" --fil anteckningar/kap3-riksdagen.txt --test
```

4. Ta bort `--test` för att spara frågorna som utkast. Lägg till `--antal 5` för att få fler eller färre (standard är 8).
5. Granska utkasten på `/admin`. Frågor som Claude tycker kan vara tvetydiga får en ⚠️-notering.

Varje körning kostar ungefär 1–3 kr i Claude-avgifter.

## Projektets struktur

```
src/
  app/          Sidorna. Mappnamnet blir adressen, t.ex. app/ova → /ova
  components/   Återanvändbara delar, t.ex. knappar och svarsalternativ
  config/       ALLA inställningar: varumärke, land, prov, pris och språk
  i18n/         Översättningar av gränssnittet (sv.ts är källan)
  lib/          Hjälpfunktioner
public/         Filer som serveras som de är (t.ex. sw.js för appläget)
scripts/        Interna skript, t.ex. utkast med Claude (körs bara av dig)
supabase/       Databasens uppbyggnad (migrations) och exempelfrågor (seed)
tests/          Vitest-tester
```

## Språk

- Sajten är på **svenska** som standard. Första gången man besöker den visas en ruta där man väljer språk
  ("Välj språk" står på flera språk, och telefonens språk föreslås överst). Man kan alltid byta med
  jordgloben i sidhuvudet. Gränssnittet finns på 24 språk.
- **Frågor och svarsalternativ är alltid på svenska**, som på provet. Arabiska, persiska, dari, pashto,
  sorani och urdu visas från höger till vänster, men frågan står alltid från vänster till höger.
- Varje språk har en egen startsida att länka till, t.ex. `/ar`, `/fa`, `/prs`, `/ti`, `/so`.
- Texterna i gränssnittet är översatta med AI. Det står diskret i sidfoten på andra språk än svenska.
  Låt gärna någon som kan språket läsa igenom de viktigaste språken.
- **Förklaringar:** när du har granskat frågor, kör `npm.cmd run oversatt-forklaringar`. Översättningarna
  märks "Maskinöversatt" i appen tills du granskar dem på frågans sida i admin (rutan *Översättningar*).
  Ändrar du den svenska förklaringen tas översättningarna bort automatiskt – kör skriptet igen.

## Betalning (Stripe)

Köp sker på `/kop`. Användaren måste kryssa i två rutor (ångerrätten och villkoren) – tidpunkten sparas i databasen.
Det är en **månadsprenumeration för 129 kr** (pris i `src/config/countries/se.ts`) utan bindningstid. Användaren säger upp
med ett klick på `/konto` och behåller tillgången till slutet av den betalda månaden. Rabattkoder (`?ref=kod`) ger
rabatt på **första månaden**, och provisionen räknas på **varje betald månad**.

**Testa betalningen (inga riktiga pengar):**

1. Logga in på [dashboard.stripe.com](https://dashboard.stripe.com) och slå på **Test mode** (uppe till höger).
2. Gå till **Developers → API keys** och kopiera **Secret key** (`sk_test_...`) till `STRIPE_SECRET_KEY` i `.env.local`.
3. Webhook lokalt: installera inget – använd i stället att tacksidan själv kontrollerar betalningen hos Stripe.
   (På den riktiga sajten används webhooken, se nedan.)
4. Köp med testkortet `4242 4242 4242 4242`, valfritt framtida datum och valfri CVC.
5. Gå till `/konto` och tryck **Säg upp prenumerationen** för att testa uppsägningen.

**Webhook på den riktiga sajten:** Stripe → **Developers → Webhooks → Add endpoint**

- URL: `https://DIN-DOMÄN/api/stripe/webhook`
- Händelser: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
- Kopiera **Signing secret** (`whsec_...`) till `STRIPE_WEBHOOK_SECRET` i Netlify.

**Återbetalning:** återbetala betalningen i Stripe och tryck **Cancel subscription → Immediately** på kunden.
Då tas tillgången bort automatiskt via webhooken.

## Marknadsföring och statistik

| Funktion | Var |
|---|---|
| Delbar sida per gratisfråga (med förhandsbild för TikTok/WhatsApp) | `/fraga/<id>` – länk finns på frågan i admin |
| Dagens fråga som bild 9:16 (med och utan svar) | `/dagens-fraga` |
| Rabatt-/partnerkoder, försäljning och provision per kod | `/admin/partner` – länka med `?ref=kod` |
| Statistik: startade/avslutade gratisövning, öppnade betalning, betalade | `/admin/statistik` |
| Startsidor per språk | `/ar`, `/fa`, `/en` … |

Statistiken sparar inga personuppgifter och använder inga spårningscookies.

## Publicera på Netlify

**Publicerad (testläge):** <https://asbra-prov.netlify.app> – byggs om automatiskt vid varje push till `main` på GitHub.
Stripe-webhooken (testläge) pekar på `/api/stripe/webhook` där. Byt till live-nycklar och skapa en ny webhook i live-läget före lansering.

1. Lägg upp projektet på GitHub (privat repo).
2. På [netlify.com](https://app.netlify.com): **Add new site → Import an existing project → GitHub** och välj repot.
   Netlify läser `netlify.toml` och känner igen Next.js automatiskt.
3. **Site configuration → Environment variables**: lägg in alla variabler från `.env.local`, med
   `NEXT_PUBLIC_SITE_URL` = din riktiga adress (t.ex. `https://dindoman.se`). `SUPABASE_ACCESS_TOKEN` behövs inte där.
4. Kör `npm.cmd run databas` lokalt med `NEXT_PUBLIC_SITE_URL` satt till den riktiga adressen, så att Supabase
   tillåter inloggningslänkar dit. Sätt sedan tillbaka `http://localhost:3000` lokalt.
5. Lägg till Stripe-webhooken (se ovan) och byt till Stripes **live**-nycklar när allt fungerar.

## Checklista före lansering

- [ ] Kontrollera provformatet (antal frågor, tid, godkäntgräns) på uhr.se och uppdatera `se.ts` + `lastVerified`.
- [x] Skriv in de riktiga kapitelrubrikerna i `se.ts`.
- [ ] Ta bort exempelfrågorna och lägg in egna, granskade frågor. Gärna minst 30 gratisfrågor från olika kapitel.
- [ ] Kör `npm.cmd run oversatt-forklaringar`.
- [ ] Bestäm varumärkesnamnet och fyll i företagsnamn, organisationsnummer och adress i `brand.ts`.
- [ ] Läs igenom villkor och integritetspolicy (gärna med jurist) och fyll i `[DATUM]` och `[E-POSTTJÄNST]`.
- [ ] Koppla en egen e-posttjänst (t.ex. Resend) i Supabase: **Authentication → Emails → SMTP Settings**.
      Sätt sedan `SUPABASE_CUSTOM_SMTP=1` och kör `npm.cmd run databas`, så får inloggningsmejlen länkar som
      fungerar i alla webbläsare.
- [ ] Stripe: verifiera företaget, lägg in webhook och byt till live-nycklar.
- [ ] Starta en riktig prenumeration med ett eget kort, säg upp den på `/konto` och återbetala i Stripe.

## Status

- [x] Grundprojekt, design, konfiguration, PWA och startsida
- [x] Frågedatabas och adminsida
- [x] Övning per kapitel
- [x] Gratisläge
- [x] Provsimulering
- [x] Resultat, repetition och framsteg
- [x] Prenumeration 129 kr/mån utan bindningstid, konton och uppsägning (kvar för dig: Stripe-nycklar och webhook)
- [x] Språk (24 språk, förklaringar översätts med skript)
- [x] Marknadsföring och statistik
- [x] Juridiska sidor (utkast) och Netlify-inställningar
- [x] Publicerad på Netlify med Stripe-webhook i testläge
