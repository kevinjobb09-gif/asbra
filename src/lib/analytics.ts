"use client";

/**
 * INTEGRITETSVÄNLIG STATISTIK
 * Sparar bara att en händelse hände, vilket språk sidan visades på och ev.
 * rabattkod – aldrig vem det var. Inga cookies, inga annonsföretag.
 */
export const EVENTS = ["free_started", "free_finished", "checkout_opened", "paid"] as const;
export type EventName = (typeof EVENTS)[number];

export function track(name: EventName) {
  try {
    const body = JSON.stringify({ name });
    // sendBeacon fungerar även om sidan stängs direkt efteråt.
    if (navigator.sendBeacon) navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
    else void fetch("/api/event", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    // Statistik får aldrig störa övningen.
  }
}
