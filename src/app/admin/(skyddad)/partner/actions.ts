"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRefCode } from "@/lib/payments/pricing";

export type CodeState = { ok: boolean; message?: string };

const codeSchema = z.object({
  code: z.string().transform((v, ctx) => {
    const code = normalizeRefCode(v);
    if (!code) {
      ctx.addIssue({ code: "custom", message: "Koden får bara innehålla a–z, 0–9, - och _ (2–40 tecken)." });
      return z.NEVER;
    }
    return code;
  }),
  partner_name: z.string().trim().min(1, "Skriv partnerns namn.").max(100),
  discount_percent: z.coerce.number().int().min(0).max(90),
  commission_percent: z.coerce.number().int().min(0).max(100),
  note: z.string().trim().max(500).optional(),
});

/** Skapar eller uppdaterar en rabatt-/partnerkod. */
export async function saveCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  await requireAdmin();
  const parsed = codeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Kontrollera fälten." };
  const { error } = await createAdminClient().from("partner_codes").upsert(parsed.data);
  if (error) return { ok: false, message: `Kunde inte spara: ${error.message}` };
  revalidatePath("/admin/partner");
  return { ok: true, message: `Koden "${parsed.data.code}" är sparad. Länk: /?ref=${parsed.data.code}` };
}

export async function toggleCode(formData: FormData) {
  await requireAdmin();
  const code = normalizeRefCode(String(formData.get("code")));
  if (!code) return;
  await createAdminClient()
    .from("partner_codes")
    .update({ active: formData.get("active") === "true" })
    .eq("code", code);
  revalidatePath("/admin/partner");
}
