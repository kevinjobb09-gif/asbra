"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  PLACEHOLDER_SOURCE_PREFIX,
  questionInputFromFormData,
  questionInputSchema,
  QUESTION_STATUSES,
} from "@/lib/questions/schema";

export type SaveState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> };

/**
 * Sparar en fråga (ny eller befintlig). Knappen som trycktes avgör status:
 * "Spara som utkast" eller "Spara och markera som granskad".
 */
export async function saveQuestion(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const status = z.enum(QUESTION_STATUSES).catch("draft").parse(formData.get("intent"));
  const parsed = questionInputSchema.safeParse(questionInputFromFormData(formData, status));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Rätta felen nedan.", fieldErrors };
  }

  const id = formData.get("id");
  const supabase = createAdminClient();
  // En granskad fråga är inte längre en exempelfråga.
  const row = { ...parsed.data, ...(status === "reviewed" ? { is_sample: false } : {}) };

  const result =
    typeof id === "string" && id
      ? await supabase.from("questions").update(row).eq("id", id).select("id").single()
      : await supabase.from("questions").insert(row).select("id").single();

  if (result.error) {
    console.error("Kunde inte spara frågan:", result.error.message);
    return { ok: false, message: "Det gick inte att spara. Försök igen." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/fragor/${result.data.id}`);
  if (!id) redirect(`/admin/fragor/${result.data.id}?sparad=1`);
  return { ok: true, message: status === "reviewed" ? "Sparad och markerad som granskad." : "Sparad som utkast." };
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const { error } = await createAdminClient().from("questions").delete().eq("id", id);
  if (error) throw new Error(`Kunde inte ta bort frågan: ${error.message}`);
  revalidatePath("/admin");
  redirect("/admin?borttagen=1");
}

export async function setReportResolved(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const resolved = formData.get("resolved") === "true";
  const { error } = await createAdminClient()
    .from("question_reports")
    .update({ resolved_at: resolved ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Kunde inte uppdatera rapporten: ${error.message}`);
  revalidatePath("/admin/rapporter");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/logga-in");
}

/** Sparar en översättning av förklaringen som granskad av människa. */
export async function saveTranslation(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      question_id: z.uuid(),
      language: z.string().regex(/^[a-z]{2,3}$/),
      explanation: z.string().trim().min(5).max(2000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Ogiltig översättning.");
  const { error } = await createAdminClient()
    .from("question_translations")
    .upsert({ ...parsed.data, status: "reviewed" }, { onConflict: "question_id,language" });
  if (error) throw new Error(`Kunde inte spara översättningen: ${error.message}`);
  revalidatePath(`/admin/fragor/${parsed.data.question_id}`);
}

/** Tar bort en översättning (den skapas på nytt av översättningsskriptet). */
export async function deleteTranslation(formData: FormData) {
  await requireAdmin();
  const questionId = z.uuid().parse(formData.get("question_id"));
  const language = z.string().regex(/^[a-z]{2,3}$/).parse(formData.get("language"));
  await createAdminClient().from("question_translations").delete().eq("question_id", questionId).eq("language", language);
  revalidatePath(`/admin/fragor/${questionId}`);
}

/** Snabbgranskning: markerar ett utkast som granskat och går vidare till nästa. */
export async function approveQuestion(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const next = String(formData.get("next") ?? "/admin/granska");
  const supabase = createAdminClient();
  const { data } = await supabase.from("questions").select("source_reference").eq("id", id).single();
  if (data?.source_reference.toUpperCase().startsWith(PLACEHOLDER_SOURCE_PREFIX)) {
    throw new Error("Frågan saknar riktig källhänvisning. Öppna den och skriv in källan först.");
  }
  const { error } = await supabase
    .from("questions")
    .update({ status: "reviewed", is_sample: false, review_note: null })
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(`Kunde inte godkänna frågan: ${error.message}`);
  revalidatePath("/admin");
  redirect(next.startsWith("/admin/granska") ? next : "/admin/granska");
}

/** Snabbgranskning: tar bort ett utkast som inte håller och går vidare till nästa. */
export async function rejectQuestion(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const next = String(formData.get("next") ?? "/admin/granska");
  const { error } = await createAdminClient().from("questions").delete().eq("id", id).eq("status", "draft");
  if (error) throw new Error(`Kunde inte ta bort frågan: ${error.message}`);
  revalidatePath("/admin");
  redirect(next.startsWith("/admin/granska") ? next : "/admin/granska");
}
