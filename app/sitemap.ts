import type { MetadataRoute } from "next";
import { getProducts, getCategories, siteConfig } from "@/lib/data";
import { guides as seedGuides } from "@/data/seed";

// Dynamic sitemap — regenerates on every build.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes = ["", "/how-it-works", "/trust", "/about", "/contact", "/guides", "/report/price", "/report/suspicious", "/privacy", "/terms"].map(
    (path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })
  );

  const productRoutes = getProducts().map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  const categoryRoutes = getCategories().map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const guideRoutes = (seedGuides as unknown as { slug: string; updatedAt: string }[]).map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: new Date(g.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...guideRoutes];
}
