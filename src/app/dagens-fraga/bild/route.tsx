import { getCountry } from "@/config";
import { pickDaily } from "@/lib/daily";
import { getFreeQuestionPool } from "@/lib/questions/public";
import { renderQuestionImage } from "@/lib/shareImage";

export const dynamic = "force-dynamic";

/**
 * DAGENS FRÅGA SOM BILD (1080×1920, för TikTok/Instagram/Reels)
 *   /dagens-fraga/bild         → frågan
 *   /dagens-fraga/bild?svar=1  → samma fråga med rätt svar markerat
 */
export async function GET(request: Request) {
  const country = getCountry();
  const showAnswer = new URL(request.url).searchParams.get("svar") === "1";
  const question = pickDaily(await getFreeQuestionPool(country.code, "sv"), new Date(), country.timeZone);
  if (!question) return new Response("Det finns inga granskade gratisfrågor än.", { status: 404 });
  return renderQuestionImage(question, { width: 1080, height: 1920, title: "Dagens fråga", showAnswer });
}
