import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/site";

const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
  ["", "daily", 1],
  ["/verzending", "monthly", 0.5],
  ["/retour", "monthly", 0.5],
  ["/voorwaarden", "yearly", 0.3],
  ["/privacy", "yearly", 0.3],
  ["/cookies", "yearly", 0.2],
  ["/herroepen", "yearly", 0.2],
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable()) return [];
  const url = siteUrl();
  const lastModified = new Date();
  return pages.map(([path, changeFrequency, priority]) => ({
    url: `${url}${path}`,
    lastModified,
    changeFrequency,
    priority,
    ...(path === "" && { images: [`${url}/images/baddies-tee-front.jpg`, `${url}/images/baddies-tee-back.jpg`] }),
  }));
}
