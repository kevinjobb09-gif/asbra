# Projektanteckningar för Claude

Övningstjänst inför svenska medborgarskapsprovet (samhällskunskap). Ägare: Kevin (gymnasieelev, begränsad
programmeringsvana) – förklara kort på svenska vad du gör och varför, och hur han testar varje delmål.
Avsluta VARJE svar med numrerade steg-för-steg-instruktioner för allt Kevin själv ska göra: vilket program
eller vilken sida han ska vara i, exakt vad han klickar på eller skriver, och vad han ska se när det fungerar.

## Next.js 16
Det här är Next.js 16 (App Router). Läs dokumentationen i `node_modules/next/dist/docs/` innan du använder
API:er du är osäker på. `middleware` heter nu `proxy`, och `params`, `searchParams`, `cookies()` samt
`id` i bildgenerering är Promises.

## Principer (får inte brytas)
- Bara frågor med status "granskad" visas för användare – säkra det i databasen (RLS), inte bara i koden.
- Kopiera aldrig text från studiematerialet "Sverige i fokus" eller konkurrenter.
- Tjänsten får aldrig se officiell ut: inga myndighetslogotyper, inga blå/gula myndighetsfärger, friskrivning synlig.
- Land är en parameter (`src/config/countries/`). Bara Sverige visas utåt.
- Varumärket finns bara i `src/config/brand.ts` (platshållare NAMN).
- Grönt = rätt svar, rött = fel svar. Använd inte de färgerna till annat.
- Claude API används bara i interna skript (`scripts/`), aldrig mot användare.

## Drift
- Hosting: Netlify (inte Vercel). Databas/inloggning: Supabase. Betalning: Stripe (befintligt konto).
- Kontaktadress för tjänsten: kevinjobb09@gmail.com.
- Senare: mobilappar för App Store / Google Play.

## Kommandon
Kevins PowerShell blockerar npm.ps1 – skriv alltid `npm.cmd` i instruktioner till honom (t.ex. `npm.cmd run dev`). Ändra aldrig Execution Policy.
Windows programkontroll blockerar osignerade .exe (t.ex. Supabase CLI) – använd webb-API:er.
`npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
