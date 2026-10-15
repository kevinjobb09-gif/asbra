import Link from "next/link";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default function NewQuestionPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm font-semibold text-primary">← Alla frågor</Link>
      <h1 className="text-2xl font-extrabold">Ny fråga</h1>
      <QuestionForm />
    </div>
  );
}
