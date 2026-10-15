"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv, serverEnv } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin/isAdminEmail";

export type LoginState = { sent: boolean; error?: string };

/** Skickar en inloggningslänk, men bara till e-postadresser som är admins. */
export async function sendAdminLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { sent: false, error: "Skriv en giltig e-postadress." };

  // Samma svar oavsett om adressen är admin eller inte, så att ingen kan
  // ta reda på vilka adresser som har tillgång.
  if (isAdminEmail(parsed.data, serverEnv.adminEmails)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/admin` },
    });
    if (error) {
      console.error("Kunde inte skicka inloggningslänk:", error.message);
      return { sent: false, error: "Det gick inte att skicka länken. Försök igen om en stund." };
    }
  }
  return { sent: true };
}
