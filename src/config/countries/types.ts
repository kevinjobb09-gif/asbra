import type { LanguageCode } from "../languages";

/** Landkod. Lägg till "fi" här när Finland ska byggas. */
export type CountryCode = "se";

export type Chapter = {
  /** Kapitelnummer i studiematerialet (1, 2, 3 …). */
  number: number;
  title: string;
};

export type CountryConfig = {
  code: CountryCode;
  /** Landets namn på provspråket. */
  name: string;
  /** Språket som provet skrivs på. Frågor och svarsalternativ visas alltid på detta språk. */
  examLanguage: LanguageCode;
  currency: "SEK" | "EUR";

  /** Studiematerialet som provet bygger på. */
  studyMaterial: {
    title: string;
    publisher: string;
    url: string;
  };

  /** Myndigheter som tjänsten INTE är kopplad till (visas i friskrivningen). */
  unaffiliatedAuthorities: string[];

  /**
   * Provformatet. OSÄKRA UPPGIFTER – kontrollera mot den officiella källan
   * och uppdatera `lastVerified` när du har gjort det.
   */
  exam: {
    questionCount: number;
    durationMinutes: number;
    optionsPerQuestion: number;
    /** Andel rätt som krävs (0–1). null = inte officiellt fastställd. */
    passThreshold: number | null;
    /** Datum (ÅÅÅÅ-MM-DD) då uppgifterna senast kontrollerades. */
    lastVerified: string;
    officialInfoUrl: string;
    /**
     * Det senaste riktiga provtillfället. Visas vid simuleringen så att det är tydligt
     * att den är en övning och hur det riktiga provet såg ut. null = inget prov har hållits.
     */
    latestTest: { date: string; questionCount: number; passMark: number } | null;
  };

  pricing: {
    /** Pris per månad i hela kronor/euro, inklusive moms. */
    amount: number;
    /** Prenumerationen förnyas varje månad tills kunden säger upp den. Ingen bindningstid. */
    interval: "month";
  };

  /** Antal frågor man får öva på gratis innan erbjudandet visas. */
  freeQuestionLimit: number;

  /** Hur många gånger i rad man måste svara rätt för att en fråga ska lämna listan "Repetera fel". */
  reviewCorrectStreak: number;

  /** Tidszon för att räkna "dagar i rad" (t.ex. "Europe/Stockholm"). */
  timeZone: string;

  /** Språk som förklaringar kan visas på, i den ordning de visas i väljaren. */
  explanationLanguages: LanguageCode[];

  chapters: Chapter[];
};
