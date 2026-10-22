import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { serverEnv } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin/isAdminEmail";

export type Access = {
  userId: string | null;
  isAdmin: boolean;
  /** Har köpt (eller fått) tillgång som gäller just nu. Admin räknas alltid som att ha tillgång. */
  hasFullAccess: boolean;
  expiresAt: string | null;
};

/** Vem är inloggad och vad får hen göra? Återanvänds inom samma sidvisning. */
export const getAccess = cache(async (): Promise<Access> => {
  const user = await getCurrentUser();
  if (!user) return { userId: null, isAdmin: false, hasFullAccess: false, expiresAt: null };

  const isAdmin = isAdminEmail(user.email, serverEnv.adminEmails);
  const now = new Date().toISOString();
  const supabase = await createClient();
  // RLS gör att man bara ser sina egna rader.
  const { data: grants } = await supabase
    .from("access_grants")
    .select("expires_at")
    .lte("starts_at", now)
    .gt("expires_at", now)
    .order("expires_at", { ascending: false })
    .limit(1);
  const expiresAt = grants?.[0]?.expires_at ?? null;

  return { userId: user.id, isAdmin, hasFullAccess: isAdmin || expiresAt !== null, expiresAt };
});
