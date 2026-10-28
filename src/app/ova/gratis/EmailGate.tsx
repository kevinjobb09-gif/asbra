"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { useI18n } from "@/i18n/client";
import { ensureUser } from "@/lib/supabase/client";
import { startFreePractice, type GateState } from "./actions";

/**
 * Rutan före gratisfrågorna: e-post (obligatorisk) och frivilligt samtycke till erbjudanden.
 * Den anonyma användaren skapas direkt när rutan visas, så att adressen kan kopplas till den.
 */
export function EmailGate({ freeCount, discountPercent }: { freeCount: number; discountPercent: number }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<GateState, FormData>(startFreePractice, {});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Även om det misslyckas eller dröjer ska formuläret gå att skicka – adressen sparas då utan koppling.
    const fallback = setTimeout(() => setReady(true), 3000);
    ensureUser()
      .catch(() => null)
      .finally(() => {
        clearTimeout(fallback);
        setReady(true);
      });
    return () => clearTimeout(fallback);
  }, []);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold">{t("freeGate.title")}</h1>
        <p className="text-lg">{t("freeGate.intro", { n: freeCount })}</p>
      </div>
      <form action={action} className="space-y-4 rounded-3xl border border-line bg-surface p-5">
        <label className="block">
          <span className="font-semibold">{t("freeGate.emailLabel")}</span>
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
        </label>
        {/* Dolt fält som bara robotar fyller i. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        {/* Frivilligt samtycke till erbjudanden – aldrig förifyllt och aldrig ett villkor för att öva. */}
        <label className="flex items-start gap-3 rounded-xl border-2 border-line p-3">
          <input type="checkbox" name="consent_marketing" className="mt-1 size-5 shrink-0 accent-primary" />
          <span className="text-sm">{t("freeGate.consent", { percent: discountPercent })}</span>
        </label>
        <p className="text-sm text-muted">
          {t("freeGate.info")}{" "}
          <Link href="/integritet" target="_blank" className="font-semibold text-primary underline">
            {t("buy.readPrivacy")}
          </Link>
        </p>
        {state.error && (
          <p role="alert" className="rounded-xl bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
            {state.error}
          </p>
        )}
        {state.usedUp && (
          <div role="alert" className="space-y-3 rounded-xl bg-primary-soft p-4">
            <p className="font-bold">{t("freeGate.usedUp")}</p>
            <ButtonLink href="/kop" className="w-full">
              {t("buy.title")}
            </ButtonLink>
          </div>
        )}
        <button
          disabled={pending || !ready}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-4 text-lg font-bold text-white shadow-md shadow-cta/25 hover:bg-cta-dark disabled:opacity-60"
        >
          <Mail size={20} aria-hidden />
          {pending || !ready ? t("freeGate.starting") : t("freeGate.button")}
        </button>
      </form>
    </div>
  );
}
