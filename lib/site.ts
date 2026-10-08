/** Public base URL: NEXT_PUBLIC_SITE_URL, else Vercel's production domain, else localhost. */
export function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

/** Only the production site may be indexed; previews and local runs stay hidden. */
export const indexable = () =>
  Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL) || process.env.VERCEL_ENV === "production";
