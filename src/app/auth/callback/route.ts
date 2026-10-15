import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safeRedirect";

/**
 * Hit kommer man när man klickar på inloggningslänken i e-posten.
 * Koden i länken byts mot en inloggning, sedan skickas man vidare.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("Inloggningen misslyckades:", error.message);
  }
  return NextResponse.redirect(`${origin}/auth/fel`);
}
