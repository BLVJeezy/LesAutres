import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  const url = indexable() ? siteUrl() : null;
  return {
    rules: {
      userAgent: "*",
      ...(url
        ? { allow: "/", disallow: ["/admin", "/api", "/bedankt"] }
        : { disallow: "/" }),
    },
    ...(url ? { sitemap: `${url}/sitemap.xml` } : {}),
  };
}
