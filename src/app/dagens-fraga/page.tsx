import type { Metadata } from "next";
import Link from "next/link";
import { getCountry } from "@/config";
import { getI18n } from "@/i18n/server";
import { pickDaily } from "@/lib/daily";
import { getFreeQuestionPool } from "@/lib/questions/public";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("share.dailyTitle") };
}
export const dynamic = "force-dynamic";

/**
 * Dagens fråga – bilder i formatet 9:16 att använda i TikTok- och Instagram-videor.
 * Bild 1 visar frågan, bild 2 samma fråga med rätt svar.
 */
export default async function DailyQuestionPage() {
  const country = getCountry();
  const { t } = await getI18n();
  const question = pickDaily(await getFreeQuestionPool(country.code, "sv"), new Date(), country.timeZone);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("share.dailyTitle")}</h1>
      {!question ? (
        <p className="text-muted">{t("free.empty")}</p>
      ) : (
        <>
          <p lang="sv" dir="ltr" className="text-xl font-bold">
            {question.question}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[false, true].map((answer) => {
              const src = `/dagens-fraga/bild${answer ? "?svar=1" : ""}`;
              return (
                <a key={src} href={src} download={`dagens-fraga${answer ? "-svar" : ""}.png`} className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- bilden skapas dynamiskt */}
                  <img src={src} alt="" width={1080} height={1920} className="w-full rounded-2xl border border-line" />
                  <span className="block text-center text-sm font-semibold text-primary">
                    {answer ? "Ladda ner (med svar)" : "Ladda ner (fråga)"}
                  </span>
                </a>
              );
            })}
          </div>
          <Link href={`/fraga/${question.id}`} className="block font-semibold text-primary">
            {t("share.question")} →
          </Link>
        </>
      )}
    </div>
  );
}
