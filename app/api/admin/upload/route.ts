import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Opslag voor afbeeldingen is niet gekoppeld." }, { status: 503 });
  const body = (await request.json()) as HandleUploadBody;
  if (body.type === "blob.generate-client-token" && !(await isAdmin()))
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("products/")) throw new Error("Ongeldig pad.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
