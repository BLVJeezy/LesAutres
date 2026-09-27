import { NextResponse } from "next/server";
import { sizes } from "@/lib/catalog";
import { addSubscriber } from "@/lib/subscribers";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  const type = body?.context?.type;
  const size = body?.context?.size ?? null;
  const color = body?.context?.color ?? null;
  if (
    !body ||
    body.consent !== true ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(body.email) ||
    !["drop", "restock"].includes(type) ||
    (size !== null && !sizes.includes(size)) ||
    (color !== null && (typeof color !== "string" || color.length > 40))
  )
    return NextResponse.json(
      { error: "Vul een geldig e-mailadres in en geef toestemming." },
      { status: 400 },
    );

  try {
    const saved = await addSubscriber({ email: body.email, type, size, color });
    if (!saved)
      return NextResponse.json(
        { error: "Inschrijven opent bij de lancering. Je e-mailadres is niet opgeslagen." },
        { status: 503 },
      );
  } catch (error) {
    console.error("Saving subscriber failed", error);
    return NextResponse.json({ error: "Inschrijven lukt nu niet. Probeer het later opnieuw." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
