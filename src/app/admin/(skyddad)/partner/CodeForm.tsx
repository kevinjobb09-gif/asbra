"use client";

import { useActionState } from "react";
import { saveCode, type CodeState } from "./actions";

const input = "mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2";

export function CodeForm() {
  const [state, action, pending] = useActionState<CodeState, FormData>(saveCode, { ok: false });
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold">Kod (i länken)</span>
        <input name="code" required placeholder="t.ex. anna" className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Partnerns namn</span>
        <input name="partner_name" required placeholder="t.ex. Anna på TikTok" className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Rabatt till köparen (%)</span>
        <input name="discount_percent" type="number" min={0} max={90} defaultValue={0} className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Provision till partnern (%)</span>
        <input name="commission_percent" type="number" min={0} max={100} defaultValue={0} className={input} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">Anteckning (t.ex. kontaktuppgifter, avtal)</span>
        <input name="note" className={input} />
      </label>
      {state.message && (
        <p className={`rounded-xl p-3 text-sm sm:col-span-2 ${state.ok ? "bg-primary-soft" : "bg-wrong-bg text-wrong"}`}>{state.message}</p>
      )}
      <button disabled={pending} className="rounded-full bg-primary px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2">
        Spara kod
      </button>
      <p className="text-xs text-muted sm:col-span-2">Finns koden redan uppdateras den. Ändringar gäller bara nya köp.</p>
    </form>
  );
}
