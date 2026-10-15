import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { CustomerLoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("login.title"), robots: { index: false } };
}

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-sm space-y-4 px-4 py-16">
      <h1 className="text-3xl font-extrabold">{t("login.title")}</h1>
      <p className="text-muted">{t("login.text")}</p>
      <CustomerLoginForm />
    </div>
  );
}
