"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Laddar om sidan efter några sekunder, tills betalningen är bekräftad. */
export function RefreshSoon({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(() => router.replace(href), 3000);
    return () => clearTimeout(id);
  }, [href, router]);
  return <div className="mx-auto mt-6 size-8 animate-spin rounded-full border-4 border-line border-t-primary" aria-hidden />;
}
