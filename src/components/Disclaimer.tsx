import { brand, getCountry } from "@/config";

/** Friskrivning: tjänsten är privat och inte kopplad till någon myndighet. */
export function Disclaimer({ className = "" }: { className?: string }) {
  const country = getCountry();
  return (
    <p className={`text-sm text-muted ${className}`}>
      {brand.name} är en privat övningstjänst. Vi är inte kopplade till{" "}
      {country.unaffiliatedAuthorities.join(" eller ")}. Frågorna är egenskrivna och bygger på fakta
      ur studiematerialet {country.studyMaterial.title}. De är inte frågor från det riktiga provet.
    </p>
  );
}
