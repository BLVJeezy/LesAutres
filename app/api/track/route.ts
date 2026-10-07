import { NextResponse } from "next/server";
import { countEvent, TRACKED, type Tracked } from "@/lib/analytics";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = body?.name;
  if (!TRACKED.includes(name)) return new NextResponse(null, { status: 204 });
  try {
    await countEvent(name as Tracked);
  } catch (error) {
    console.error("Tracking failed", error);
  }
  return new NextResponse(null, { status: 204 });
}
