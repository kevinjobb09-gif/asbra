import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLanguageCode } from "@/config/languages";
import { normalizeRefCode } from "@/lib/payments/pricing";

const YEAR = 60 * 60 * 24 * 365;
const REF_DAYS = 30;

/**
 * Körs före varje sidvisning:
 * 1. Sparar rabattkoden från länkar som ?ref=kod (i 30 dagar), så att rabatten gäller vid köp.
 * 2. Sparar språket när någon besöker en språksida som /ar eller /fa.
 * 3. Förnyar inloggningen (Supabase-sessionen) så att användaren inte loggas ut i onödan.
 */
export async function proxy(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; maxAge: number }[] = [];

  const ref = normalizeRefCode(request.nextUrl.searchParams.get("ref"));
  if (ref) cookiesToSet.push({ name: "ref", value: ref, maxAge: REF_DAYS * 24 * 60 * 60 });

  const langMatch = request.nextUrl.pathname.match(/^\/([a-z]{2,3})\/?$/);
  if (langMatch && isLanguageCode(langMatch[1])) cookiesToSet.push({ name: "lang", value: langMatch[1], maxAge: YEAR });

  // Låt sidan som renderas nu se de nya värdena direkt.
  for (const c of cookiesToSet) request.cookies.set(c.name, c.value);

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(supabaseCookies, headers) {
          supabaseCookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          supabaseCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    });
    // Kontrollerar och förnyar sessionen. Ta inte bort.
    await supabase.auth.getClaims();
  }

  for (const c of cookiesToSet) {
    response.cookies.set(c.name, c.value, { path: "/", maxAge: c.maxAge, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Kör inte på bilder, ikoner, statiska filer eller Stripes webhook.
  matcher: [
    "/((?!_next/static|_next/image|api/stripe|icon|apple-icon|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
