"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { changeSubscription, type CancelState } from "./actions";

/**
 * Säg upp med ett klick (plus en bekräftelse), eller ångra uppsägningen.
 * Det ska vara lika enkelt att säga upp som att köpa.
 */
export function SubscriptionControls({ canceled, periodEndText }: { canceled: boolean; periodEndText: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<CancelState, FormData>(changeSubscription, {});

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!canceled && !window.confirm(t("account.cancelConfirm", { date: periodEndText }))) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="cancel" value={canceled ? "false" : "true"} />
      {state.error && <p className="text-sm text-wrong">{state.error}</p>}
      <button
        disabled={pending}
        className={`w-full rounded-full px-5 py-3 font-bold disabled:opacity-60 ${
          canceled ? "bg-primary text-white" : "border-2 border-line bg-surface text-ink hover:border-primary"
        }`}
      >
        {canceled ? t("account.resumeButton") : t("account.cancelButton")}
      </button>
    </form>
  );
}
