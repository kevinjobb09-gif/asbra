import { requireAdmin } from "@/lib/admin/auth";
import { toCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** E-postlistan som CSV – bara adresser som har samtyckt till erbjudanden. */
export async function GET() {
  // Layouten skyddar inte route handlers, så kontrollen måste göras här.
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("email_signups")
    .select("email, language, marketing_consent_at")
    .order("marketing_consent_at", { ascending: false });
  if (error) return new Response("Kunde inte hämta e-postlistan.", { status: 500 });

  const csv = toCsv([
    ["email", "sprak", "samtycke"],
    ...(data ?? []).map((r) => [r.email, r.language, r.marketing_consent_at.slice(0, 10)]),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="epostlista-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
