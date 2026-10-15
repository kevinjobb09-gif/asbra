import { z } from "zod";
import { getFreeQuestion } from "@/lib/questions/public";
import { renderQuestionImage } from "@/lib/shareImage";
import { renderAppIcon } from "@/lib/appIcon";

/** Förhandsbilden som visas när länken delas i WhatsApp, TikTok, Instagram m.fl. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kan du svaret?";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = z.uuid().safeParse(id).success ? await getFreeQuestion(id, "sv") : null;
  if (!question) return renderAppIcon(630);
  return renderQuestionImage(question, { ...size, title: "Kan du svaret?" });
}
