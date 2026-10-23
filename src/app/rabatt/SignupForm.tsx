"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { ButtonLink } from "@/components/ButtonLink";
import { signUp, type SignupState } from "./actions";

export function SignupForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, {});

  if (state.used) {
    return <p className="rounded-xl bg-primary-soft p-4 font-semibold">{t("welcome.alreadyUsed")}</p>;
  }

  if (state.code) {
    return (
      <div className="space-y-4 rounded-3xl border-2 border-primary bg-surface p-6 text-center">
        <Gift className="mx-auto size-10 text-primary" aria-hidden />
        <h2 className="text-xl font-extrabold">{t("welcome.successTitle")}</h2>
        <p dir="ltr" className="select-all rounded-xl bg-primary-soft px-4 py-3 font-mono text-2xl font-bold tracking-wide text-primary">
          {state.code}
        </p>
        <p className="text-sm">{t("welcome.successText", { percent: state.percent ?? 10, email: state.email ?? "" })}</p>
        {state.emailed && <p className="text-sm text-muted">{t("welcome.emailed")}</p>}
        <ButtonLink href={`/kop?kod=${encodeURIComponent(state.code)}`} size="lg" className="w-full">
          {t("welcome.useNow")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="font-semibold">{t("welcome.emailLabel")}</span>
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
      {/* Samtycke till e-post enligt GDPR – rutan är aldrig förifylld. */}
      <label className="flex items-start gap-3 rounded-xl border-2 border-line bg-surface p-3">
        <input type="checkbox" name="consent_marketing" required className="mt-1 size-5 shrink-0 accent-primary" />
        <span className="text-sm">
          {t("welcome.consent")}{" "}
          <Link href="/integritet" target="_blank" className="font-semibold text-primary underline">
            {t("buy.readPrivacy")}
          </Link>
        </span>
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-4 text-lg font-bold text-white shadow-md shadow-cta/25 hover:bg-cta-dark disabled:opacity-60"
      >
        <Gift size={20} aria-hidden />
        {pending ? t("welcome.sending") : t("welcome.button")}
      </button>
    </form>
  );
}
