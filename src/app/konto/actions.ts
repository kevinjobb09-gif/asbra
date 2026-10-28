"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getI18n } from "@/i18n/server";
import { cancelAllSubscriptionsNow, cancelSubscriptionNow } from "@/lib/payments/server";
import { forgetFreeSignup } from "@/lib/freeSignup";
import { forgetSignup } from "@/lib/welcome";

export type DeleteState = { error?: string };
export type CancelState = { error?: string };

/**
 * Raderar kontot och all övningsdata (svar, prov, tillgång). En pågående
 * prenumeration avslutas direkt. Betalningarna finns kvar hos Stripe för
 * bokföringen, men kopplingen till personen och e-posten tas bort här.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { t } = await getI18n();
  const typed = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (typed !== t("account.deleteConfirmWord").toUpperCase()) {
    return { error: t("account.deleteConfirmLabel") };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/konto");

  await cancelAllSubscriptionsNow(data.user.id);
  const admin = createAdminClient();
  await admin.from("purchases").update({ email: null }).eq("user_id", data.user.id);
  // E-post från rabattsidan och gratisfrågorna. Anonyma användares adress försvinner med användaren.
  if (data.user.email) await Promise.all([forgetSignup(data.user.email), forgetFreeSignup(data.user.email)]);
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) {
    console.error("Kunde inte radera konto:", error.message);
    return { error: t("account.deleteError") };
  }
  await supabase.auth.signOut();
  redirect("/konto?raderad=1");
}

/** Säger upp prenumerationen (cancel = true) eller ångrar uppsägningen (cancel = false). */
export async function cancelSubscription(): Promise<CancelState> {
  const { t } = await getI18n();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/konto");
  try {
    await cancelSubscriptionNow(data.user.id);
  } catch (e) {
    console.error("Kunde inte säga upp prenumerationen:", e instanceof Error ? e.message : e);
    return { error: t("account.cancelError") };
  }
  revalidatePath("/konto");
  return {};
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
