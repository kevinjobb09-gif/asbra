# Annonsguide – Medborgarhjälpen (Meta och TikTok)

Videorna ligger i `marknadsforing/videor/`. Alla är 9:16 (1080×1920), ungefär 15 sekunder och har ljudeffekter.
Lägg gärna till populär musik direkt i TikTok eller Instagram när du publicerar organiskt.

Varje språk har tre videor:

| Fil | Innehåll |
|---|---|
| `…_fraga-riksdagen.mp4` | Quiz: "Hur många ledamöter har riksdagen?" med nedräkning och svar |
| `…_fraga-nationaldagen.mp4` | Quiz: "Vilket datum är Sveriges nationaldag?" |
| `…_funktioner.mp4` | Vad tjänsten erbjuder: gratisfrågor, alla kapitel, provsimulering, 24 språk, pris |

Språk: `sv` svenska, `en` engelska, `ar` arabiska, `fa` persiska (fungerar även för dari), `so` somaliska,
`ti` tigrinja, `ckb` kurdiska (sorani).

## Innan du startar annonser

- [ ] Domänen medborgarhjalpen.se fungerar (DNS klar).
- [ ] Minst de 17 gratisfrågorna är godkända på `/admin/granska`. Annars möts besökarna av "kommer snart".
- [ ] Låt gärna en person som har språket som modersmål läsa texterna i videorna och annonserna.
      Texterna är översatta med AI.

## Regler att följa (viktigt)

- Skriv aldrig att man **garanterat klarar provet**, och påstå inte att tjänsten är officiell.
- Använd inga logotyper från UHR, Migrationsverket eller regeringen, och inga blågula "myndighetsfärger".
- Hitta inte på kundomdömen eller resultat.
- Friskrivningen finns i slutet av varje video. Låt den vara kvar.

## Målgrupp i Meta Ads Manager

1. **Plats:** Sverige.
2. **Ålder:** 18–65+.
3. **Språk** (under *Detailed targeting → Languages*): välj språket som matchar videon, till exempel *Arabic* för
   de arabiska videorna. Meta tillåter inte att man riktar annonser efter ursprung eller etnicitet, men språk går bra.
4. **Placering:** *Advantage+ placements* (Reels, Stories och flöde).
5. **Mål:** *Traffic* (trafik) till att börja med, sedan *Sales* när du har fått in några köp.
6. **Länk:** använd språksidan, till exempel `https://medborgarhjalpen.se/ar`.
   Då möts besökaren av sajten på rätt språk direkt.

| Video | Länk |
|---|---|
| sv | https://medborgarhjalpen.se |
| en | https://medborgarhjalpen.se/en |
| ar | https://medborgarhjalpen.se/ar |
| fa | https://medborgarhjalpen.se/fa |
| so | https://medborgarhjalpen.se/so |
| ti | https://medborgarhjalpen.se/ti |
| ckb | https://medborgarhjalpen.se/ckb |

**Budget att börja med:** 50 kr per dag och språk i 5–7 dagar. Behåll sedan de videor som ger billigast klick
och flest gratisövningar (se `/admin/statistik`), och stäng av resten.

## Annonstexter (primär text + rubrik)

**Svenska**
- Text: Ska du göra medborgarskapsprovet? Öva på frågor om det svenska samhället – precis som på provet. Börja med 15 frågor gratis.
- Rubrik: Öva gratis inför medborgarskapsprovet

**English**
- Text: Taking the Swedish citizenship test? Practise questions about Swedish society in Swedish – just like the real test – with explanations in your language. Start with 15 free questions.
- Headline: Practise for the citizenship test for free

**العربية**
- النص: هل ستخوض اختبار الجنسية السويدية؟ تدرّب على أسئلة عن المجتمع السويدي باللغة السويدية – تمامًا كما في الاختبار – مع شرح بلغتك. ابدأ بـ15 سؤالًا مجانًا.
- العنوان: تدرّب مجانًا على اختبار الجنسية

**فارسی**
- متن: آزمون تابعیت سوئد را می‌دهید؟ سؤال‌های جامعهٔ سوئد را به زبان سوئدی تمرین کنید – درست مثل آزمون – با توضیحات به زبان خودتان. با 15 سؤال رایگان شروع کنید.
- عنوان: تمرین رایگان برای آزمون تابعیت

**Soomaali**
- Qoraal: Ma galaysaa imtixaanka dhalashada Iswiidhan? Ku tababaro su'aalaha bulshada Iswiidhan oo Iswiidhish ah – sida imtixaanka oo kale – sharaxaadna af Soomaali ah. Ku bilow 15 su'aalood oo bilaash ah.
- Cinwaan: Imtixaanka dhalashada – ku tababaro bilaash

**ትግርኛ**
- ጽሑፍ፦ ፈተና ዜግነት ሽወደን ክትወስድ ዲኻ? ብዛዕባ ሕብረተሰብ ሽወደን ሕቶታት ብሽወድኛ ተለማመድ – ከም ኣብቲ ፈተና – መብርሂ ድማ ብቋንቋኻ። ብ15 ናጻ ሕቶታት ጀምር።
- ኣርእስቲ፦ ንፈተና ዜግነት ብነጻ ተለማመድ

**کوردی (سۆرانی)**
- دەق: تاقیکردنەوەی ڕەگەزنامەی سویدی دەکەیت؟ پرسیارەکانی کۆمەڵگای سوید بە سویدی ڕاهێنان بکە – وەک تاقیکردنەوەکە – لەگەڵ ڕوونکردنەوە بە زمانی خۆت. بە 15 پرسیاری بەخۆڕایی دەست پێبکە.
- سەردێڕ: ڕاهێنانی بەخۆڕایی بۆ تاقیکردنەوەی ڕەگەزنامە

## Skapa fler videor

Ändra eller lägg till texter i `marknadsforing/videogenerator/texts.js` och kör:

```
node marknadsforing/videogenerator/skapa-videor.mjs
```

Bara vissa språk: `node marknadsforing/videogenerator/skapa-videor.mjs ar so`
