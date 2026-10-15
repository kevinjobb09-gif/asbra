"use client";

import { useEffect } from "react";

/** Registrerar service workern som behövs för att sajten ska kunna installeras som app (PWA). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Utan service worker fungerar sajten ändå, bara inte offline-sidan.
      });
    }
  }, []);
  return null;
}
