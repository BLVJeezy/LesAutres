"use client";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { MAX_IMAGES } from "@/lib/catalog";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

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
        if (!ACCEPTED.includes(file.type))
          throw new Error("gebruik een JPG-, PNG- of WEBP-foto");
        if (file.size > 10 * 1024 * 1024) throw new Error("foto is groter dan 10 MB");
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
        const blob = await upload(`products/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          multipart: file.size > 5 * 1024 * 1024,
        });
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, blob.url] : prev));
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
          Foto&apos;s uploaden kan zodra de Blob-opslag in Vercel gekoppeld is.
        </p>
      )}
      {error && <p className="admin-alert">{error}</p>}
    </fieldset>
  );
}
