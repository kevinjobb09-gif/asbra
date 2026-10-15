import { BookOpen, Clock, Languages, RotateCcw, TrendingUp, ShieldCheck } from "lucide-react";
import { brand, formatPrice, getCountry, languages } from "@/config";
import { ButtonLink } from "@/components/ButtonLink";
import { AnswerOption } from "@/components/AnswerOption";
import { Disclaimer } from "@/components/Disclaimer";

const country = getCountry();

export default function HomePage() {
  const { exam, pricing, freeQuestionLimit, chapters } = country;

  return (
    <div className="mx-auto max-w-3xl px-4">
      {/* 1. Hero: vad tjänsten gör, på några sekunder */}
      <section className="pt-10 pb-8 text-center sm:pt-16">
        <p className="mb-3 inline-block rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          Medborgarskapsprovet i samhällskunskap
        </p>
        <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-5xl">
          Öva inför provet. Förstå svaren på <span className="text-primary">ditt språk</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Frågor på svenska, precis som på provet. Förklaringar på det språk du förstår bäst.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <ButtonLink href="/ova/gratis" size="lg" className="w-full max-w-sm">
            Börja öva gratis
          </ButtonLink>
          <p className="text-sm text-muted">
            Inget konto behövs · {freeQuestionLimit} gratis frågor
          </p>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-sm font-medium text-muted">Förklaringar på:</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {country.explanationLanguages.map((code) => {
              const lang = languages[code];
              return (
                <li
                  key={code}
                  lang={lang.htmlLang}
                  dir={lang.dir}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-sm"
                >
                  {lang.nativeName}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 2. Visar hur det ser ut när man svarar rätt */}
      <section aria-label="Så ser en övningsfråga ut" className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <p className="text-sm font-semibold text-muted">Så ser det ut när du övar</p>
        <div aria-hidden className="mt-3 h-4 w-4/5 rounded bg-line" />
        <div aria-hidden className="mt-2 mb-4 h-4 w-3/5 rounded bg-line" />
        <div className="space-y-2" aria-hidden>
          <AnswerOption index={0} text="Svarsalternativ A" state="dimmed" disabled />
          <AnswerOption index={1} text="Rätt! Bra jobbat." state="correct" disabled />
          <AnswerOption index={2} text="Svarsalternativ C" state="dimmed" disabled />
        </div>
        <p className="mt-4 rounded-2xl bg-primary-soft p-4 text-sm">
          <strong>Förklaring:</strong> Efter varje svar ser du varför det är rätt och var i{" "}
          {country.studyMaterial.title} du kan läsa mer.
        </p>
      </section>

      {/* 3. Funktioner */}
      <section className="mt-12">
        <h2 className="text-center text-2xl font-extrabold">Allt du behöver för att klara provet</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          <Feature icon={<BookOpen />} title={`Öva per kapitel`}>
            Alla {chapters.length} kapitel i {country.studyMaterial.title}, en fråga i taget.
          </Feature>
          <Feature icon={<Clock />} title="Gör ett provtest">
            {exam.questionCount} frågor på {exam.durationMinutes} minuter, med klocka.
          </Feature>
          <Feature icon={<RotateCcw />} title="Repetera dina fel">
            Frågor du svarat fel på kommer tillbaka tills du kan dem.
          </Feature>
          <Feature icon={<TrendingUp />} title="Se dina framsteg">
            Se vilka kapitel du kan och vilka du behöver plugga mer på.
          </Feature>
          <Feature icon={<Languages />} title="Ditt språk">
            Läs förklaringen på ditt språk, och på svenska om du vill.
          </Feature>
          <Feature icon={<ShieldCheck />} title="Kontrollerade frågor">
            Varje fråga har en källa och granskas innan den publiceras.
          </Feature>
        </ul>
      </section>

      {/* 4. Pris */}
      <section className="mt-12 rounded-3xl bg-primary p-6 text-center text-white sm:p-10">
        <h2 className="text-2xl font-extrabold">Ett pris. Ingen prenumeration.</h2>
        <p className="mt-4 text-5xl font-extrabold">{formatPrice(country)}</p>
        <p className="mt-2 text-white/85">
          Betala en gång och få tillgång till allt i {pricing.accessMonths} månader.
        </p>
        <ButtonLink href="/ova/gratis" size="lg" className="mt-6 w-full max-w-sm">
          Prova gratis först
        </ButtonLink>
      </section>

      {/* 5. Vanliga frågor */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold">Vanliga frågor</h2>
        <div className="mt-4 space-y-2">
          <Faq q="Är det här det officiella provet?">
            Nej. {brand.name} är en privat tjänst för att öva. Vi är inte kopplade till någon
            myndighet. Information om det riktiga provet finns hos UHR.
          </Faq>
          <Faq q="Vilket språk är frågorna på?">
            Frågorna och svaren är på svenska, eftersom provet är på svenska. Förklaringarna kan du
            läsa på ditt eget språk.
          </Faq>
          <Faq q="Behöver jag skapa ett konto?">
            Nej, du kan börja öva direkt. Du skapar ett konto först när du köper. Det du har övat
            på sparas.
          </Faq>
          <Faq q="Hur många frågor har provet?">
            Enligt de uppgifter vi har: cirka {exam.questionCount} frågor på {exam.durationMinutes}{" "}
            minuter. Kontrollera alltid aktuella uppgifter hos UHR.
          </Faq>
        </div>
      </section>

      <Disclaimer className="mt-10 text-center" />
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary [&>svg]:size-5">
        {icon}
      </span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted">{children}</p>
      </div>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-4">
      <summary className="cursor-pointer list-none font-semibold marker:hidden">
        <span className="me-2 inline-block text-primary transition-transform group-open:rotate-90">›</span>
        {q}
      </summary>
      <p className="mt-2 text-muted">{children}</p>
    </details>
  );
}
