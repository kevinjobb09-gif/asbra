import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Användarvillkor" };

export default function Page() {
  return <ComingSoon title="Användarvillkor" text="Användarvillkoren publiceras här innan tjänsten öppnar." />;
}
