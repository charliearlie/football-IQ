import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://football-iq.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/play`,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/play/career-path`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/transfer-guess`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/connections`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/topical-quiz`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/timeline`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
