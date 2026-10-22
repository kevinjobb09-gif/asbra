import type { Metadata } from "next";
import { getCountry, languages } from "@/config";
import { getI18n } from "@/i18n/server";
import { getAccess } from "@/lib/access";
import { getUserSubscription } from "@/lib/payments/server";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ButtonLink";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { SubscriptionControls } from "./SubscriptionControls";
import { logout } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("account.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ raderad?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const { raderad } = await searchParams;
  const country = getCountry();
  // Exakt kontroll här (inte bara signaturen), så att e-post och status alltid är aktuella.
  const supabase = await createClient();
  const [{ t, lang }, access, { data }] = await Promise.all([getI18n(), getAccess(), supabase.auth.getUser()]);
  const user = data.user;
  const subscription = user ? await getUserSubscription(user.id) : null;
  const dateFormat = new Intl.DateTimeFormat(languages[lang].htmlLang, { dateStyle: "long", timeZone: country.timeZone });
  const periodEndText = subscription?.periodEnd ? dateFormat.format(new Date(subscription.periodEnd)) : "";

  if (raderad) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">{t("account.deleted")}</h1>
        <ButtonLink href="/" variant="outline" className="mt-8">
          {t("common.toHome")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("account.title")}</h1>

      {user?.email ? (
        <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
          <p>
            <span className="text-sm text-muted">{t("account.email")}</span>
            <br />
            <strong dir="ltr">{user.email}</strong>
          </p>

          {subscription ? (
            <div className="space-y-3 rounded-xl bg-primary-soft p-4">
              <p className="font-semibold">
                {subscription.status === "past_due"
                  ? t("account.subscriptionPastDue")
                  : subscription.cancelAtPeriodEnd
                    ? t("account.subscriptionCanceled", { date: periodEndText })
                    : t("account.subscriptionActive", { date: periodEndText })}
              </p>
              {!subscription.cancelAtPeriodEnd && <p className="text-sm">{t("offer.noCommitment")}</p>}
              <SubscriptionControls canceled={subscription.cancelAtPeriodEnd} periodEndText={periodEndText} />
            </div>
          ) : access.expiresAt ? (
            <p>{t("account.accessUntil", { date: dateFormat.format(new Date(access.expiresAt)) })}</p>
          ) : (
            <p>{t("account.noAccess")}</p>
          )}

          {!access.hasFullAccess && <ButtonLink href="/kop">{t("account.buy")}</ButtonLink>}
          <form action={logout}>
            <button className="font-semibold text-primary underline-offset-2 hover:underline">{t("account.logout")}</button>
          </form>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
          <p>{t("account.notLoggedIn")}</p>
          <ButtonLink href="/logga-in">{t("account.login")}</ButtonLink>
          {user && <p className="text-sm text-muted">{t("account.anonymousNote")}</p>}
        </section>
      )}

      {user && (
        <section className="space-y-3 rounded-2xl border-2 border-wrong-line/40 bg-surface p-5">
          <h2 className="text-lg font-extrabold">{t("account.deleteTitle")}</h2>
          <p className="text-sm text-muted">{t("account.deleteText")}</p>
          <DeleteAccountForm />
        </section>
      )}
    </div>
  );
}
