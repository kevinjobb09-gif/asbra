"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ensureUser, getBrowserClient } from "@/lib/supabase/client";

type Status = "closed" | "open" | "sending" | "sent" | "error";

/** Låter användaren rapportera fel i en fråga. Kommentaren är frivillig. */
export function ReportButton({ questionId, disabled }: { questionId: string; disabled?: boolean }) {
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
    return <p className="text-sm text-muted">Tack! Vi kontrollerar frågan.</p>;
  }

  if (status === "closed") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setStatus("open")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted underline-offset-2 hover:underline disabled:opacity-50"
      >
        <Flag size={14} aria-hidden /> Rapportera fel i frågan
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surface p-3">
      <label className="block text-sm font-semibold" htmlFor={`report-${questionId}`}>
        Vad är fel? (frivilligt)
      </label>
      <textarea
        id={`report-${questionId}`}
        rows={2}
        maxLength={1000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm"
      />
      {status === "error" && <p className="text-sm text-wrong">Det gick inte att skicka. Försök igen.</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={status === "sending"}
          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {status === "sending" ? "Skickar …" : "Skicka"}
        </button>
        <button type="button" onClick={() => setStatus("closed")} className="px-3 py-2 text-sm font-semibold text-muted">
          Avbryt
        </button>
      </div>
    </div>
  );
}
