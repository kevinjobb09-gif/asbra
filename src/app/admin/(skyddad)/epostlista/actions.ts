"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { forgetSignup } from "@/lib/welcome";

/** Avregistrerar en adress från e-postlistan (när någon ber om det). */
export async function unsubscribe(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;
  await forgetSignup(email);
  revalidatePath("/admin/epostlista");
}
