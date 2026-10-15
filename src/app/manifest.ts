import type { MetadataRoute } from "next";
import { brand } from "@/config";

/** Gör att sajten kan läggas på hemskärmen som en app (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} – ${brand.tagline}`,
    short_name: brand.shortName,
    description: brand.tagline,
    lang: "sv",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: brand.colors.background,
    theme_color: brand.colors.background,
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
