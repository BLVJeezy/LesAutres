import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return [];
  return ["", "/privacy", "/voorwaarden", "/retour", "/verzending"].map(
    (path) => ({ url: `${url}${path}` }),
  );
}
