"use client";
import { useRef, useState } from "react";
import { MAX_IMAGES } from "@/lib/catalog";

const MAX_EDGE = 2000;

/** Shrinks a photo to max 2000px JPEG so phone photos (incl. HEIC on iPhone) stay under the upload limit. */
async function prepare(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (blob) return blob;
  } catch {}
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  throw new Error("dit bestandstype wordt niet ondersteund");
}

async function uploadPhoto(file: File): Promise<string> {
  const body = new FormData();
  const blob = await prepare(file);
  body.append("file", new File([blob], file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/jpeg" ? ".jpg" : ""), { type: blob.type || file.type }));
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || "uploaden mislukt");
  return data.url;
}

export function ImageManager({
  initial,
  canUpload,
}: {
  initial: string[];
  canUpload: boolean;
}) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const full = images.length >= MAX_IMAGES;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = [...files].slice(0, MAX_IMAGES - images.length);
    setBusy((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await uploadPhoto(file);
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, url] : prev));
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  const move = (i: number) =>
    setImages((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });

  return (
    <fieldset>
      <legend className="sr-only">Foto&apos;s</legend>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="admin-images">
        {images.map((src, i) => (
          <figure key={`${src}-${i}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
            {i === 0 && <span className="admin-badge">Hoofdfoto</span>}
            <div>
              {i > 0 && (
                <button type="button" onClick={() => move(i)} aria-label="Maak eerder / hoofdfoto">←</button>
              )}
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Verwijderen"
              >
                ✕
              </button>
            </div>
          </figure>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <figure key={`busy-${i}`} className="uploading">Uploaden…</figure>
        ))}
        {canUpload && !full && (
          <label className="admin-add-photo">
            <span aria-hidden>+</span>
            Foto toevoegen
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {!canUpload && (
        <p className="admin-note">
          Foto&apos;s uploaden kan zodra Firebase gekoppeld is.
        </p>
      )}
      {error && <p className="admin-alert">{error}</p>}
    </fieldset>
  );
}
