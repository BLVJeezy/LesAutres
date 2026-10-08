import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { indexable, siteUrl } from "@/lib/site";
const url = siteUrl();
export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: "Les Autres — Same people. Different perspective.",
  description:
    "Drop 001. The Baddies Tee. Heavyweight cotton, oversized fit. Independent streetwear from Belgium. Worldwide, for the others.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LES AUTRES — DROP 001",
    description: "Same people. Different perspective.",
    locale: "nl_BE",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  applicationName: "Les Autres",
  appleWebApp: { title: "Les Autres" },
  robots: {
    index: indexable(),
    follow: indexable(),
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl-BE" data-scroll-behavior="smooth">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
