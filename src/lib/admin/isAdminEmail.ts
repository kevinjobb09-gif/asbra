/** Kontrollerar om en e-postadress finns i listan över admins (skiftlägesokänsligt). */
export function isAdminEmail(email: string | null | undefined, adminEmails: string[]): boolean {
  if (!email) return false;
  return adminEmails.includes(email.trim().toLowerCase());
}
