import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Öva" };

export default function Page() {
  return <ComingSoon title="Öva" text="Övningen öppnar snart. Vi lägger in och granskar frågorna just nu." />;
}
