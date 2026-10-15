import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    // Läser .env.local så att databastesterna kan köras när Supabase är inställt.
    env: loadEnv(mode, process.cwd(), ""),
    // "server-only" stoppar import i webbläsaren; i tester ersätts den med en tom modul.
    alias: { "server-only": fileURLToPath(new URL("./tests/empty.ts", import.meta.url)) },
  },
}));
