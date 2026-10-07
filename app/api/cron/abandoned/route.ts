import { NextResponse } from "next/server";
import { sweepAbandoned } from "@/lib/abandoned";

export const dynamic = "force-dynamic";

/** Daily Vercel cron (see vercel.json); also triggered on regular traffic via /api/drop. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sent = await sweepAbandoned(true);
  return NextResponse.json({ sent });
}
