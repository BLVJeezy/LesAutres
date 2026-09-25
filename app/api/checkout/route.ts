import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Dit is een preview. Betalen opent zodra prijzen, voorraad en verzenddata bevestigd zijn.",
    },
    { status: 503 },
  );
}
