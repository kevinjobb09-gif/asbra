import { LANGUAGE_CODES } from "../languages";
import type { CountryConfig } from "./types";

/**
 * SVERIGE – inställningar för provet och tjänsten.
 *
 * Provformatet kontrollerat på uhr.se 2026-10-19: provet är på svenska, på papper,
 * med flervalsfrågor (fyra alternativ, ett rätt). UHR har ännu inte publicerat
 * provtid och antal frågor för nästa provtillfälle, och gränsen för godkänt sätts
 * i efterhand. 60 frågor / 90 minuter nedan är därför vår övningsmodell –
 * uppdatera när UHR publicerar uppgifterna.
 */
export const se: CountryConfig = {
  code: "se",
  name: "Sverige",
  examLanguage: "sv",
  currency: "SEK",

  studyMaterial: {
    title: "Sverige i fokus",
    publisher: "UHR",
    url: "https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/",
  },

  unaffiliatedAuthorities: ["UHR", "Migrationsverket"],

  exam: {
    questionCount: 60,
    durationMinutes: 90,
    optionsPerQuestion: 4,
    passThreshold: null, // Inte officiellt fastställd enligt de uppgifter vi har.
    lastVerified: "2026-10-28",
    officialInfoUrl: "https://www.uhr.se/medborgarskapsprovet/",
    // Provet 15 augusti 2026: 40 frågor, 28 rätt för godkänt (Sveriges Radio 22 okt 2026).
    latestTest: { date: "2026-08-15", questionCount: 40, passMark: 28 },
  },

  // Månadsprenumeration utan bindningstid. Ändra priset här.
  pricing: {
    amount: 129,
    interval: "month",
  },

  freeQuestionLimit: 15,

  reviewCorrectStreak: 2,

  timeZone: "Europe/Stockholm",

  // Alla språk i src/config/languages.ts. Ta bort ett språk här för att dölja det.
  explanationLanguages: [...LANGUAGE_CODES],

  // Kapitlen i Sverige i fokus (1:a upplagan, korrigerad version 2026-08-10).
  chapters: [
    { number: 1, title: "Landet Sverige" },
    { number: 2, title: "Sveriges demokratiska system" },
    { number: 3, title: "Så här styrs Sverige" },
    { number: 4, title: "Politiska val och partier" },
    { number: 5, title: "Lag och rätt" },
    { number: 6, title: "Mediernas roll" },
    { number: 7, title: "Mänskliga rättigheter" },
    { number: 8, title: "Arbetsmarknad och privatekonomi" },
    { number: 9, title: "Välfärdssamhället" },
    { number: 10, title: "Sveriges moderna historia" },
    { number: 11, title: "Sverige och omvärlden" },
    { number: 12, title: "En sekulär stat och ett mångreligiöst land" },
    { number: 13, title: "Traditioner och högtider" },
  ],
};
