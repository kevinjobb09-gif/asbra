import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { isAdminEmail } from "./isAdminEmail";

/** Är den inloggade användaren admin? Skickar inte vidare någonstans. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return isAdminEmail(data.user?.email, serverEnv.adminEmails);
}

/**
 * Stoppar alla som inte är admin. Anropa överst i varje adminsida och
 * adminåtgärd. Returnerar den inloggade adminens e-post.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  // getUser() frågar Supabase-servern, så en förfalskad cookie räcker inte.
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email || !isAdminEmail(email, serverEnv.adminEmails)) {
    redirect("/admin/logga-in");
  }
  return email;
}
