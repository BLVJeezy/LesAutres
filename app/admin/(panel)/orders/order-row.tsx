"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function OrderRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className="clickable"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
