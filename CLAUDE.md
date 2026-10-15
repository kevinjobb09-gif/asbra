# Projektanteckningar för Claude

Övningstjänst inför svenska medborgarskapsprovet (samhällskunskap). Ägare: Kevin (gymnasieelev, begränsad
programmeringsvana) – förklara kort på svenska vad du gör och varför, och hur han testar varje delmål.

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
`npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
