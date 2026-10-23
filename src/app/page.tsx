import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";
import { homePath, languageAlternates } from "@/lib/seo";

// Länkar till samma startsida på alla språk, så att Google visar rätt språk i sökresultaten.
export const metadata: Metadata = {
  alternates: { canonical: "/", languages: languageAlternates(homePath) },
};

export default function HomePage() {
  return <HomeContent />;
}
