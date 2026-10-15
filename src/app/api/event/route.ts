import { NextResponse, type NextRequest } from "next/server";
import { isLanguageCode } from "@/config";
import { normalizeRefCode } from "@/lib/payments/pricing";
import { recordEvent } from "@/lib/payments/server";

const ALLOWED = new Set(["free_started", "free_finished"]);

/**
 * Tar emot statistik från webbläsaren. Bara händelsens namn, sidans språk och
 * ev. rabattkod sparas – ingen IP-adress och ingen användare.
 * (checkout_opened och paid sparas av servern själv.)
 */
export async function POST(request: NextRequest) {
  let name: unknown;
  try {
    ({ name } = await request.json());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof name !== "string" || !ALLOWED.has(name)) return new NextResponse(null, { status: 400 });
  const lang = request.cookies.get("lang")?.value;
  await recordEvent(name as "free_started" | "free_finished", {
    language: isLanguageCode(lang) ? lang : null,
    refCode: normalizeRefCode(request.cookies.get("ref")?.value),
  });
  return new NextResponse(null, { status: 204 });
}
