import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Inloggningen misslyckades", robots: { index: false } };

export default function AuthErrorPage() {
  return (
    <ComingSoon
      title="Inloggningen misslyckades"
      text="Länken kan vara för gammal eller redan använd. Öppna den i samma webbläsare som du begärde den i, eller be om en ny länk."
    />
  );
}
