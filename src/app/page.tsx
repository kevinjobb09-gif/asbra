import type { Metadata } from "next";
import { LANGUAGE_CODES } from "@/config";
import { HomeContent } from "@/components/HomeContent";

// Länkar till samma startsida på alla språk, så att Google visar rätt språk i sökresultaten.
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(LANGUAGE_CODES.filter((c) => c !== "sv").map((c) => [c, `/${c}`])),
  },
};

export default function HomePage() {
  return <HomeContent />;
}
