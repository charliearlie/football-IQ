import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/cron/", "/api/auth/", "/login"],
      },
    ],
    sitemap: "https://www.football-iq.app/sitemap.xml",
  };
}
