import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin — Les Autres",
  robots: { index: false, follow: false },
  applicationName: "Les Autres",
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Les Autres", statusBarStyle: "black" },
};

export const viewport: Viewport = { themeColor: "#1a1a1a" };

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="admin">{children}</div>;
}
