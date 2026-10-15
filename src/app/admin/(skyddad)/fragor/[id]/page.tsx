import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteQuestionButton } from "@/components/admin/DeleteQuestionButton";
import type { Question } from "@/lib/questions/schema";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ sparad?: string }> };

export default async function EditQuestionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { sparad } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = createAdminClient();
  const { data } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const question = data as Question;

  const { data: reports } = await supabase
    .from("question_reports")
    .select("id, message, created_at")
    .eq("question_id", id)
    .is("resolved_at", null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm font-semibold text-primary">← Alla frågor</Link>
        <StatusBadge status={question.status} />
        {question.is_sample && (
          <span className="rounded-full bg-cta-soft px-2 py-0.5 text-xs font-semibold text-cta-dark">
            Exempelfråga – byt ut eller granska mot källan
          </span>
        )}
        {question.is_free && question.status === "reviewed" && (
          <Link href={`/fraga/${question.id}`} className="text-sm font-semibold text-primary">
            Delbar sida →
          </Link>
        )}
        <Link href={`/ova/kapitel/${question.chapter}?utkast=1`} className="text-sm font-semibold text-primary">
          Förhandsvisa kapitlet som användare →
        </Link>
        <span className="ms-auto text-xs text-muted">
          Ändrad {new Date(question.updated_at).toLocaleString("sv-SE")}
        </span>
      </div>

      {!!reports?.length && (
        <div className="rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm">
          <strong>{reports.length} öppna felrapporter:</strong>
          <ul className="mt-1 list-disc ps-5">
            {reports.map((r) => (
              <li key={r.id}>{r.message || "(ingen kommentar)"}</li>
            ))}
          </ul>
        </div>
      )}

      <QuestionForm question={question} savedNotice={!!sparad} />

      <div className="border-t border-line pt-4">
        <DeleteQuestionButton id={question.id} />
      </div>
    </div>
  );
}
