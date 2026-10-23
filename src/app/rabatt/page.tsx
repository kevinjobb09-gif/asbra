import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/welcome";
import { SignupForm } from "./SignupForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("welcome.title", { percent: WELCOME_DISCOUNT_PERCENT }) };
}

export default async function DiscountSignupPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("welcome.title", { percent: WELCOME_DISCOUNT_PERCENT })}</h1>
      <p className="text-lg">{t("welcome.intro")}</p>
      <SignupForm />
    </div>
  );
}
