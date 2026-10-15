import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { robots: { index: false } };

export default async function OfflinePage() {
  const { t } = await getI18n();
  return <ComingSoon title={t("offline.title")} text={t("offline.text")} buttonLabel={t("common.toHome")} />;
}
