import Image from "next/image";

export type LookbookPhoto = { src: string; alt: string; w: number; h: number };

/** Endless, auto-scrolling filmstrip of photos (pauses on hover; static scroll with reduced motion). */
export function Lookbook({ photos }: { photos: LookbookPhoto[] }) {
  const loop = [...photos, ...photos];
  return (
    <div className="lookbook-viewport" aria-roledescription="carousel" aria-label="Les Autres lookbook">
      <div className="lookbook-track" style={{ animationDuration: `${photos.length * 5}s` }}>
        {loop.map((p, i) => (
          <figure
            key={i}
            className={`lookbook-item ${p.w > p.h ? "wide" : "tall"}`}
            aria-hidden={i >= photos.length || undefined}
          >
            <Image
              src={p.src}
              alt={i >= photos.length ? "" : p.alt}
              width={p.w}
              height={p.h}
              sizes="(max-width: 700px) 75vw, 40vw"
              loading={i < 3 ? "eager" : "lazy"}
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
