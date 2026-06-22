import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://scamshield-ai-kohl.vercel.app";

const routes = ["", "/dashboard", "/scan", "/chat", "/history", "/agents", "/audit"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date("2026-06-22T00:00:00.000Z"),
    changeFrequency: route ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
