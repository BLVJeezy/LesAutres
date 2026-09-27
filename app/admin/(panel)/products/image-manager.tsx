"use client";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { MAX_IMAGES } from "@/lib/catalog";

export function ImageManager({
  initial,
  canUpload,
}: {
  initial: string[];
  canUpload: boolean;
}) {
  const [images, setImages] = useState(initial);
  const [link, setLink] = useState("");
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
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
        const blob = await upload(`products/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          multipart: file.size > 5 * 1024 * 1024,
        });
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, blob.url] : prev));
      } catch (e) {
        setError(`Uploaden van ${file.name} mislukt: ${(e as Error).message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  function addLink() {
    const url = link.trim();
    if (!/^(\/[\w\-./]+|https:\/\/[^\s"'<>]+)$/.test(url)) {
      setError("Gebruik een pad zoals /images/foto.jpg of een https-link.");
      return;
    }
    setError("");
    setImages((prev) => [...prev, url]);
    setLink("");
  }

  const move = (i: number) =>
    setImages((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });

  return (
    <fieldset>
      <legend>Afbeeldingen ({images.length}/{MAX_IMAGES}) — de eerste is de hoofdfoto</legend>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="admin-images">
        {images.map((src, i) => (
          <figure key={`${src}-${i}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
            {i === 0 && <span className="admin-badge">Hoofdfoto</span>}
            <div>
              {i > 0 && (
                <button type="button" onClick={() => move(i)} aria-label="Naar voren">←</button>
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
      </div>
      <div className="admin-row">
        {canUpload ? (
          <label className="admin-btn small admin-upload">
            + Foto&apos;s uploaden
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={full || busy > 0}
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        ) : (
          <p className="admin-note">
            Uploaden kan zodra Vercel Blob gekoppeld is. Tot dan kun je een link toevoegen.
          </p>
        )}
        <div className="admin-link-add">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="/images/foto.jpg of https://…"
            disabled={full}
          />
          <button type="button" className="admin-btn small" onClick={addLink} disabled={full || !link}>
            Link toevoegen
          </button>
        </div>
      </div>
      {error && <p className="admin-alert">{error}</p>}
    </fieldset>
  );
}
