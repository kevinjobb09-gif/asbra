"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getI18n } from "@/i18n/server";

export type DeleteState = { error?: string };

/**
 * Raderar kontot och all övningsdata (svar, prov, tillgång). Köpet finns kvar
 * hos Stripe för bokföringen, men kopplingen till personen och e-posten tas bort här.
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

  const admin = createAdminClient();
  await admin.from("purchases").update({ email: null }).eq("user_id", data.user.id);
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) {
    console.error("Kunde inte radera konto:", error.message);
    return { error: t("account.deleteError") };
  }
  await supabase.auth.signOut();
  redirect("/konto?raderad=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
