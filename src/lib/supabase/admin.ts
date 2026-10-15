import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Supabase-klient med den HEMLIGA nyckeln. Den går förbi alla säkerhetsregler
 * (RLS) och får bara användas på servern, efter att requireAdmin() har
 * kontrollerat att det är du som är inloggad.
 */
export function createAdminClient() {
  return createClient(publicEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
