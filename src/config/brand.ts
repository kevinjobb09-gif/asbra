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
