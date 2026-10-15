import { getI18n } from "@/i18n/server";
import { ComingSoon } from "@/components/ComingSoon";

export default async function NotFound() {
  const { t } = await getI18n();
  return <ComingSoon title={t("notFound.title")} text={t("notFound.text")} buttonLabel={t("common.toHome")} />;
}
