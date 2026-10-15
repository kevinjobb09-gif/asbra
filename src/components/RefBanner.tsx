import { getI18n } from "@/i18n/server";
import { getActiveRef } from "@/lib/payments/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Visar att en rabattkod är aktiv, så att besökaren vet att rabatten gäller. */
export async function RefBanner() {
  if (!isSupabaseConfigured()) return null;
  const ref = await getActiveRef();
  if (!ref || ref.discountPercent === 0) return null;
  const { t } = await getI18n();
  return (
    <div className="bg-cta px-4 py-2 text-center text-sm font-semibold text-white">
      {t("refBanner.text", { code: ref.code, percent: ref.discountPercent })}
    </div>
  );
}
