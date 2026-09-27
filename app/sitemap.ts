import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable()) return [];
  const url = siteUrl();
  return ["", "/voorwaarden", "/privacy", "/cookies", "/retour", "/verzending", "/herroepen"].map(
    (path) => ({ url: `${url}${path}` }),
  );
}
