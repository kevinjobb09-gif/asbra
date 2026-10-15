"use client";

import { Check, X } from "lucide-react";
import { useI18n } from "@/i18n/client";

/**
 * Lägen för ett svarsalternativ:
 * - idle:     inte besvarat ännu
 * - selected: valt men inte rättat (används i provsimuleringen)
 * - correct:  rätt svar – rutan blir GRÖN
 * - wrong:    användarens felaktiga val – rutan blir röd
 * - dimmed:   övriga alternativ efter rättning
 */
export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

const styles: Record<AnswerState, string> = {
  idle: "border-line bg-surface hover:border-primary hover:bg-primary-soft",
  selected: "border-primary bg-primary-soft",
  correct: "border-correct-line bg-correct-bg text-correct font-semibold",
  wrong: "border-wrong-line bg-wrong-bg text-wrong",
  dimmed: "border-line bg-surface opacity-60",
};

const letters = ["A", "B", "C", "D", "E", "F"];

type Props = {
  index: number;
  text: string;
  state?: AnswerState;
  onSelect?: () => void;
  disabled?: boolean;
};

export function AnswerOption({ index, text, state = "idle", onSelect, disabled }: Props) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      data-state={state}
      aria-pressed={state === "selected"}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-start text-base transition-colors disabled:cursor-default ${styles[state]}`}
    >
      <span
        aria-hidden
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          state === "correct"
            ? "bg-correct-line text-white"
            : state === "wrong"
              ? "bg-wrong-line text-white"
              : "bg-primary-soft text-primary"
        }`}
      >
        {state === "correct" ? <Check size={18} strokeWidth={3} /> : state === "wrong" ? <X size={18} strokeWidth={3} /> : letters[index]}
      </span>
      <span className="flex-1">{text}</span>
      {state === "correct" && <span className="sr-only">{t("session.correctSr")}</span>}
      {state === "wrong" && <span className="sr-only">{t("session.wrongSr")}</span>}
    </button>
  );
}
