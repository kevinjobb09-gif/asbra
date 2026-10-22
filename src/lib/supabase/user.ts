import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null; isAnonymous: boolean };

/**
 * Vem är inloggad? Kontrollerar inloggningens signatur lokalt (ES256-nycklar från
 * Supabase), så det behövs inget extra anrop till Supabase-servern för varje sida.
 * Databasens säkerhetsregler (RLS) gäller fortfarande för alla frågor.
 * Svaret återanvänds inom samma sidvisning.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" && claims.email ? claims.email : null,
    isAnonymous: claims.is_anonymous === true,
  };
});
