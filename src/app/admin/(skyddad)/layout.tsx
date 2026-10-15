import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const { count: openReports } = await createAdminClient()
    .from("question_reports")
    .select("id", { count: "exact", head: true })
    .is("resolved_at", null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2 text-sm font-semibold">
        <Link href="/admin" className="rounded-full px-3 py-2 hover:bg-primary-soft">Frågor</Link>
        <Link href="/admin/fragor/ny" className="rounded-full px-3 py-2 hover:bg-primary-soft">+ Ny fråga</Link>
        <Link href="/admin/rapporter" className="rounded-full px-3 py-2 hover:bg-primary-soft">
          Felrapporter
          {!!openReports && (
            <span className="ms-1 rounded-full bg-cta px-2 py-0.5 text-xs text-white">{openReports}</span>
          )}
        </Link>
        <Link href="/ova/gratis?utkast=1" className="rounded-full px-3 py-2 hover:bg-primary-soft">Testa gratisläget</Link>
        <Link href="/prov?utkast=1&minuter=2" className="rounded-full px-3 py-2 hover:bg-primary-soft">Testa provet (2 min)</Link>
        <span className="ms-auto hidden text-muted sm:inline">{email}</span>
        <form action={signOut}>
          <button className="rounded-full px-3 py-2 hover:bg-primary-soft">Logga ut</button>
        </form>
      </nav>
      {children}
    </div>
  );
}
