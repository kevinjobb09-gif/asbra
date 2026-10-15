"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { sendLoginLink, type LoginState } from "./actions";

export function CustomerLoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLoginLink, { sent: false });

  if (state.sent) return <p className="rounded-2xl bg-primary-soft p-4">{t("login.sent")}</p>;

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="font-semibold">{t("login.emailLabel")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-3 text-lg"
        />
      </label>
      {state.error && <p className="text-sm text-wrong">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white disabled:opacity-60">
        {pending ? t("login.sending") : t("login.send")}
      </button>
    </form>
  );
}
