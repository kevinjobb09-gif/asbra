"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { shouldTrackPath } from "@/lib/pageViews";

/**
 * RÄKNAR SIDVISNINGAR – utan cookies och utan cookie-banner.
 *
 * Besöks-id:t slumpas och finns bara i minnet medan fliken är öppen (inte i cookies
 * eller localStorage). Vi mäter bara tiden när sidan faktiskt syns. När besökaren byter
 * sida, byter flik eller stänger skickas tiden. Ingen IP-adress eller identitet sparas.
 */

type Current = { id: string; seq: number; path: string; activeMs: number; visibleSince: number | null };

let visitId: string | null = null;
let seq = 0;
let current: Current | null = null;
let listening = false;

function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function send(page: Current, ms?: number) {
  try {
    const body = JSON.stringify({ id: page.id, visitId, seq: page.seq, path: page.path, ms });
    // sendBeacon fungerar även när sidan stängs.
    if (navigator.sendBeacon?.("/api/sidvisning", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/sidvisning", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    // Statistiken får aldrig störa sidan.
  }
}

/** Skickar hur länge sidan har synts hittills. */
function flush() {
  if (!current) return;
  const ms = current.activeMs + (current.visibleSince === null ? 0 : performance.now() - current.visibleSince);
  send(current, Math.round(ms));
}

function onVisibilityChange() {
  if (!current) return;
  if (document.visibilityState === "hidden") {
    if (current.visibleSince !== null) current.activeMs += performance.now() - current.visibleSince;
    current.visibleSince = null;
    flush();
  } else {
    current.visibleSince = performance.now();
  }
}

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!listening) {
      listening = true;
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("pagehide", flush);
    }
    // Samma sida igen (t.ex. när React kör om effekten) räknas inte två gånger.
    if (current?.path === pathname) return;
    flush();
    current = null;
    if (!shouldTrackPath(pathname) || seq >= 500) return;

    visitId ??= uuid();
    seq += 1;
    current = {
      id: uuid(),
      seq,
      path: pathname,
      activeMs: 0,
      visibleSince: document.visibilityState === "visible" ? performance.now() : null,
    };
    send(current);
  }, [pathname]);

  return null;
}
