"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { startCheckout, type CheckoutState } from "./actions";

type Props = { price: string; defaultEmail?: string };

export function BuyForm({ price, defaultEmail }: Props) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, { email: defaultEmail });

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="font-semibold">{t("buy.emailLabel")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          defaultValue={state.email}
          className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-3 text-lg"
        />
        <span className="mt-1 block text-sm text-muted">{t("buy.emailHelp")}</span>
      </label>

      {/* Uttryckligt samtycke enligt reglerna för digitalt innehåll – rutorna är aldrig förifyllda. */}
      <label className="flex items-start gap-3 rounded-xl border-2 border-line bg-surface p-3">
        <input type="checkbox" name="consent_delivery" required className="mt-1 size-5 shrink-0 accent-primary" />
        <span className="text-sm">{t("buy.consentDelivery")}</span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border-2 border-line bg-surface p-3">
        <input type="checkbox" name="consent_terms" required className="mt-1 size-5 shrink-0 accent-primary" />
        <span className="text-sm">
          {t("buy.consentTerms")}{" "}
          <Link href="/villkor" target="_blank" className="font-semibold text-primary underline">
            {t("buy.readTerms")}
          </Link>{" "}
          ·{" "}
          <Link href="/integritet" target="_blank" className="font-semibold text-primary underline">
            {t("buy.readPrivacy")}
          </Link>
        </span>
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-wrong-bg p-3 text-sm font-semibold text-wrong">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-4 text-lg font-bold text-white shadow-md shadow-cta/25 hover:bg-cta-dark disabled:opacity-60"
      >
        <Lock size={18} aria-hidden />
        {pending ? t("common.loading") : t("buy.pay", { price })}
      </button>
      <p className="text-center text-xs text-muted">{t("buy.secure")}</p>
    </form>
  );
}
