import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personliga sidor och admin ska inte synas i sökmotorer.
      disallow: ["/admin", "/api", "/konto", "/kop", "/resultat", "/repetera", "/logga-in", "/auth"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
