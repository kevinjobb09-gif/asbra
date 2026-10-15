import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Supabase-klient för servern som agerar som den inloggade användaren.
 * Den följer databasens säkerhetsregler (RLS). Skapa en ny för varje anrop.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Anropat från en serverkomponent där cookies inte kan sättas.
          // Det är okej: proxy.ts uppdaterar sessionen i stället.
        }
      },
    },
  });
}
