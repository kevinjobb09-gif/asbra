"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Tunn laddningsrad högst upp som syns direkt när man klickar på en länk
 * inom sajten, så att varje klick ger omedelbar respons även på långsamt nät.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setActive(url.pathname);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Sidan har bytts (eller navigeringen blev aldrig av): dölj raden.
  const visible = active !== null && active !== pathname;
  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setActive(null), 10_000);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden">
      <div className="h-full w-full origin-left animate-[nav-progress_2s_ease-out_forwards] bg-cta" />
    </div>
  );
}
