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

| Kommando | Vad det gör |
|---|---|
| `npm run dev` | Startar sajten lokalt för utveckling |
| `npm test` | Kör alla tester en gång |
| `npm run test:watch` | Kör testerna igen varje gång du sparar |
| `npm run lint` | Letar efter vanliga kodfel |
| `npm run typecheck` | Kontrollerar TypeScript-typerna |
| `npm run build` | Bygger sajten som den blir i produktion |
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

## Projektets struktur

```
src/
  app/          Sidorna. Mappnamnet blir adressen, t.ex. app/ova → /ova
  components/   Återanvändbara delar, t.ex. knappar och svarsalternativ
  config/       ALLA inställningar: varumärke, land, prov, pris och språk
  lib/          Hjälpfunktioner
public/         Filer som serveras som de är (t.ex. sw.js för appläget)
tests/          Vitest-tester
```

## Status

- [x] Delmål 1: Grundprojekt, design, konfiguration, PWA och startsida
- [ ] Delmål 2: Frågedatabas och adminsida
- [ ] Delmål 3: Övning per kapitel
- [ ] Delmål 4: Gratisläge
- [ ] Delmål 5: Provsimulering
- [ ] Delmål 6: Resultat, repetition och framsteg
- [ ] Delmål 7: Betalning och konton
- [ ] Delmål 8: Språk
- [ ] Delmål 9: Marknadsföring och statistik
- [ ] Delmål 10: Juridiska sidor och publicering på Netlify

Instruktioner för att lägga till frågor och publicera på Netlify skrivs in här när de delarna är byggda.
