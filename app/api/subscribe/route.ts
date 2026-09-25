import { NextResponse } from "next/server";
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  if (
    !body ||
    body.consent !== true ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(body.email) ||
    !["drop", "restock"].includes(body.context?.type)
  )
    return NextResponse.json(
      { error: "Vul een geldig e-mailadres in en geef toestemming." },
      { status: 400 },
    );
  // No address is persisted or sent until a double-opt-in provider is configured.
  return NextResponse.json(
    {
      error:
        "Inschrijven opent bij de lancering. Je e-mailadres is niet opgeslagen.",
    },
    { status: 503 },
  );
}
