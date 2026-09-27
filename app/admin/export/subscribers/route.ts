import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listSubscribers } from "@/lib/subscribers";

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const rows = (await listSubscribers()).map((s) =>
    [s.email, s.type === "drop" ? "nieuwe drops" : "maat terug", s.size ?? "", new Date(s.createdAt).toISOString()]
      .map(cell)
      .join(","),
  );
  const csv = ["email,lijst,maat,datum", ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="les-autres-inschrijvingen.csv"',
      "cache-control": "no-store",
    },
  });
}
