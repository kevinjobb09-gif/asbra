import { statusLabels, type QuestionStatus } from "@/lib/questions/schema";

/** Visar "Utkast" eller "Granskad". Grönt används inte här – det är reserverat för rätt svar. */
export function StatusBadge({ status }: { status: QuestionStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status === "reviewed" ? "bg-primary text-white" : "bg-line text-ink"}`}
    >
      {statusLabels[status]}
    </span>
  );
}
