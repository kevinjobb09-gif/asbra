/**
 * ALLT SOM RÖR VARUMÄRKET FINNS HÄR.
 *
 * Byter du namn: ändra `name`, `shortName` och `initial` nedan. Resten av sajten,
 * ikonerna och förhandsbilderna hämtar namnet härifrån. Domän: medborgarhjalpen.se
 */
export const brand = {
  /** Varumärkesnamnet. */
  name: "Medborgarhjälpen",
  /** Kort namn som visas under ikonen på hemskärmen (max ~12 tecken). */
  shortName: "Medborgarhjälpen",
  /** Bokstaven som visas i appikonen. */
  initial: "M",
  /** Kort slogan på svenska. */
  tagline: "Öva inför medborgarskapsprovet",

  /** Kontaktadress som visas på sajten och i villkoren. */
  contactEmail: "medborgarhjalpen@gmail.com",

  /**
   * Uppgifter om säljaren. Organisationsnummer och adress visas i villkoren och
   * integritetspolicyn först när de är ifyllda (lämna tomt tills de finns).
   */
  company: {
    legalName: "Medborgarhjälpen",
    orgNumber: "",
    address: "",
  },

  /** Färger som används i appikonen och manifestet (övriga färger finns i globals.css). */
  colors: {
    primary: "#4c2fc8",
    background: "#fffaf3",
  },
} as const;

/** Säljarens namn, följt av organisationsnummer och adress när de är ifyllda. */
export function sellerDetails(): string {
  const { legalName, orgNumber, address } = brand.company as { legalName: string; orgNumber: string; address: string };
  return [legalName, orgNumber && `organisationsnummer ${orgNumber}`, address].filter(Boolean).join(", ");
}
