import type { Metadata } from "next";
import "./globals.css";
const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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
  robots: {
    index: !!process.env.NEXT_PUBLIC_SITE_URL,
    follow: !!process.env.NEXT_PUBLIC_SITE_URL,
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl-BE">
      <body>{children}</body>
    </html>
  );
}
