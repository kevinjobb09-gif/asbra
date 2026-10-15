import type { MetadataRoute } from "next";
import { getCountry, LANGUAGE_CODES } from "@/config";
import { getFreeQuestionPool } from "@/lib/questions/public";

/** Lista över sidor som Google ska hitta, inklusive språksidor och delbara gratisfrågor. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const pages = ["", "/ova", "/ova/gratis", "/dagens-fraga", "/om", "/villkor", "/integritet"];
  const languagePages = LANGUAGE_CODES.filter((c) => c !== "sv").map((c) => `/${c}`);

  let questionPages: string[] = [];
  try {
    questionPages = (await getFreeQuestionPool(getCountry().code, "sv")).map((q) => `/fraga/${q.id}`);
  } catch {
    // Utan databas (t.ex. vid första bygget) listas bara de vanliga sidorna.
  }

  return [...pages, ...languagePages, ...questionPages].map((path) => ({
    url: `${site}${path || "/"}`,
    changeFrequency: path.startsWith("/fraga") ? "monthly" : "weekly",
    priority: path === "" ? 1 : languagePages.includes(path) ? 0.9 : 0.6,
  }));
}
