import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Integritetspolicy" };

export default function Page() {
  return <ComingSoon title="Integritetspolicy" text="Integritetspolicyn publiceras här innan tjänsten öppnar." />;
}
