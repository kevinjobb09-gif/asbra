"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { cancelSubscription, type CancelState } from "./actions";

/**
 * Säg upp med ett klick (plus en bekräftelse). Tillgången upphör direkt.
 * Det ska vara lika enkelt att säga upp som att köpa.
 */
export function SubscriptionControls() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<CancelState>(cancelSubscription, {});

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(t("account.cancelConfirm"))) e.preventDefault();
      }}
      className="space-y-2"
    >
      {state.error && <p className="text-sm text-wrong">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-full border-2 border-line bg-surface px-5 py-3 font-bold text-ink hover:border-primary disabled:opacity-60"
      >
        {t("account.cancelButton")}
      </button>
    </form>
  );
}
