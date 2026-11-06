import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isLanguageCode } from "@/config";
import { isBot, MAX_DURATION_MS, normalizePath, shouldTrackPath } from "@/lib/pageViews";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  id: z.uuid(),
  visitId: z.uuid(),
  seq: z.number().int().min(1).max(500),
  path: z.string().min(1).max(500),
  /** Aktiv tid på sidan. Saknas när sidan precis har öppnats. */
  ms: z.number().int().min(0).optional(),
});

/**
 * Tar emot sidvisningar från webbläsaren (se PageTracker). Sparar sidans adress,
 * ordning i besöket, tid och språk – ingen IP-adress, ingen user-agent, ingen användare.
 * Samma rad skickas två gånger: när sidan öppnas och när besökaren lämnar den (med tiden).
 */
export async function POST(request: NextRequest) {
  if (isBot(request.headers.get("user-agent"))) return new NextResponse(null, { status: 204 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = normalizePath(body.path);
  if (!shouldTrackPath(path)) return new NextResponse(null, { status: 204 });

  const lang = request.cookies.get("lang")?.value;
  const row = {
    id: body.id,
    visit_id: body.visitId,
    seq: body.seq,
    path,
    language: isLanguageCode(lang) ? lang : null,
  };
  const db = createAdminClient().from("page_views");
  // Första gången: lägg till raden. Med tid: lägg till eller uppdatera tiden.
  const { error } =
    body.ms === undefined
      ? await db.upsert(row, { onConflict: "id", ignoreDuplicates: true })
      : await db.upsert({ ...row, duration_ms: Math.min(body.ms, MAX_DURATION_MS) }, { onConflict: "id" });
  if (error) console.error("Kunde inte spara sidvisning:", error.message);
  return new NextResponse(null, { status: 204 });
}
