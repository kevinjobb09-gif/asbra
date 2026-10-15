/**
 * ALLT SOM RÖR VARUMÄRKET FINNS HÄR.
 *
 * När namnet är bestämt: ändra `name` (och gärna `shortName` och `initial`)
 * nedan. Resten av sajten, ikonerna och förhandsbilderna hämtar namnet härifrån.
 */
export const brand = {
  /** Varumärkesnamnet. Platshållare tills namnet är bestämt. */
  name: "NAMN",
  /** Kort namn som visas under ikonen på hemskärmen (max ~12 tecken). */
  shortName: "NAMN",
  /** Bokstaven som visas i appikonen. */
  initial: "N",
  /** Kort slogan på svenska. */
  tagline: "Öva inför medborgarskapsprovet",

  /** Kontaktadress som visas på sajten och i villkoren. */
  contactEmail: "kevinjobb09@gmail.com",

  /** Uppgifter om säljaren. Fyll i innan sajten publiceras. */
  company: {
    legalName: "[FÖRETAGSNAMN]",
    orgNumber: "[ORGANISATIONSNUMMER]",
    address: "[ADRESS]",
  },

  /** Färger som används i appikonen och manifestet (övriga färger finns i globals.css). */
  colors: {
    primary: "#4c2fc8",
    background: "#fffaf3",
  },
} as const;
