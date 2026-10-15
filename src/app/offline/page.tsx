import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Ingen internetanslutning" };

export default function Page() {
  return <ComingSoon title="Ingen internetanslutning" text="Du verkar vara offline. Kontrollera din anslutning och försök igen." />;
}
