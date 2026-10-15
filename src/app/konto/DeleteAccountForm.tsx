"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-sm font-semibold">{t("account.deleteConfirmLabel")}</span>
        <input name="confirm" autoComplete="off" className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2" />
      </label>
      {state.error && <p className="text-sm text-wrong">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-full border-2 border-wrong-line px-5 py-3 font-bold text-wrong disabled:opacity-60"
      >
        {t("account.deleteButton")}
      </button>
    </form>
  );
}
