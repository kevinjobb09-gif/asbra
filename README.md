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
| `npm start` | Kör den byggda sajten (efter `npm run build`) |

## Var ändrar jag vad?

| Vill du ändra … | Fil |
|---|---|
| Varumärkesnamnet (NAMN), kontaktadress, företagsuppgifter | `src/config/brand.ts` |
| Provformat, pris, antal gratisfrågor, kapitelnamn | `src/config/countries/se.ts` |
| Språk för förklaringar | `src/config/languages.ts` och `explanationLanguages` i `se.ts` |
| Färger | `src/app/globals.css` (överst) och `colors` i `brand.ts` |
| Startsidans text | `src/app/page.tsx` |

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

> Supabase inbyggda e-post kan bara skicka ett fåtal mejl i timmen. Det räcker för test,
> men innan lansering behöver vi koppla en riktig e-posttjänst (delmål 7).

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
(`/ova/gratis`). Varje besökare får 30 gratisfrågor (ändras i `freeQuestionLimit` i `se.ts`), spridda över kapitlen.
Välj minst 30 gratisfrågor från olika kapitel. Översikten på `/admin` visar hur många du har.
Övriga granskade frågor kan bara läsas av den som har köpt tillgång. Det skyddet ligger i databasen.

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
  lib/          Hjälpfunktioner
public/         Filer som serveras som de är (t.ex. sw.js för appläget)
scripts/        Interna skript, t.ex. utkast med Claude (körs bara av dig)
supabase/       Databasens uppbyggnad (migrations) och exempelfrågor (seed)
tests/          Vitest-tester
```

## Status

- [x] Delmål 1: Grundprojekt, design, konfiguration, PWA och startsida
- [x] Delmål 2: Frågedatabas och adminsida
- [x] Delmål 3: Övning per kapitel
- [x] Delmål 4: Gratisläge
- [ ] Delmål 5: Provsimulering
- [ ] Delmål 6: Resultat, repetition och framsteg
- [ ] Delmål 7: Betalning och konton
- [ ] Delmål 8: Språk
- [ ] Delmål 9: Marknadsföring och statistik
- [ ] Delmål 10: Juridiska sidor och publicering på Netlify

Instruktioner för att lägga till frågor och publicera på Netlify skrivs in här när de delarna är byggda.
