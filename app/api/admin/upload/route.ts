import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { bucket, firebaseConfigured } from "@/lib/firebase";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const b = firebaseConfigured() ? bucket() : null;
  if (!b) return NextResponse.json({ error: "Firebase is niet gekoppeld." }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Geen foto ontvangen." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Gebruik een JPG-, PNG- of WEBP-foto." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Foto is te groot (max. 4 MB)." }, { status: 400 });

  const token = randomUUID();
  const path = `products/${randomUUID()}.${ext}`;
  try {
    await b.file(path).save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      contentType: file.type,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
  } catch (error) {
    console.error("Upload to Firebase Storage failed", error);
    return NextResponse.json(
      { error: "Opslaan in Firebase Storage mislukt. Is Storage aangezet in Firebase?" },
      { status: 502 },
    );
  }
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
    : "https://firebasestorage.googleapis.com";
  const url = `${host}/v0/b/${b.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return NextResponse.json({ url });
}
