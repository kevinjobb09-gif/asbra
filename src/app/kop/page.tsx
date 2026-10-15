import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Lås upp allt" };

// Betalningen byggs i delmål 7.
export default function BuyPage() {
  return <ComingSoon title="Betalningen öppnar snart" text="Vi gör klart betalningen just nu. Fortsätt gärna öva gratis så länge." />;
}
