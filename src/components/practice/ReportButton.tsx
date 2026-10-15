"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ensureUser, getBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/client";

type Status = "closed" | "open" | "sending" | "sent" | "error";

/** Låter användaren rapportera fel i en fråga. Kommentaren är frivillig. */
export function ReportButton({ questionId, disabled }: { questionId: string; disabled?: boolean }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("closed");
  const [message, setMessage] = useState("");

  async function send() {
    setStatus("sending");
    const userId = await ensureUser();
    if (!userId) return setStatus("error");
    const { error } = await getBrowserClient()
      .from("question_reports")
      .insert({ question_id: questionId, user_id: userId, message: message.trim() || null });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return <p className="text-sm text-muted">{t("report.thanks")}</p>;
  }

  if (status === "closed") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setStatus("open")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted underline-offset-2 hover:underline disabled:opacity-50"
      >
        <Flag size={14} aria-hidden /> {t("report.button")}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surface p-3">
      <label className="block text-sm font-semibold" htmlFor={`report-${questionId}`}>
        {t("report.label")}
      </label>
      <textarea
        id={`report-${questionId}`}
        rows={2}
        maxLength={1000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm"
      />
      {status === "error" && <p className="text-sm text-wrong">{t("report.error")}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={status === "sending"}
          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {status === "sending" ? t("report.sending") : t("report.send")}
        </button>
        <button type="button" onClick={() => setStatus("closed")} className="px-3 py-2 text-sm font-semibold text-muted">
          {t("report.cancel")}
        </button>
      </div>
    </div>
  );
}
