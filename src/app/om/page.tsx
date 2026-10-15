import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Om oss" };

export default function Page() {
  return <ComingSoon title="Om oss" text="Information om vem som står bakom tjänsten publiceras här." />;
}
