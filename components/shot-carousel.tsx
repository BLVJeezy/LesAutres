"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Photo = { src: string; alt: string };

const HOLD_MS = 2000;
const SHOT_S = 0.9;

export function ShotCarousel({ photos }: { photos: Photo[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Doubled so the item wrapping from far-left to far-right is never visible mid-move.
  const slides = photos.length < 4 ? [...photos, ...photos] : photos;
  const n = slides.length;

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % n),
      HOLD_MS + SHOT_S * 1000,
    );
    return () => clearInterval(id);
  }, [reduced, n]);

  return (
    <div className="shot-carousel" aria-roledescription="carousel">
      {slides.map((photo, i) => {
        let rel = (i - index + n) % n;
        if (rel > n / 2) rel -= n;
        const visible = Math.abs(rel) <= 1;
        return (
          <motion.div
            key={i}
            className="shot-slide"
            aria-hidden={rel !== 0}
            initial={false}
            animate={{
              x: `${rel * 88}vw`,
              scale: rel === 0 ? 1 : 0.82,
              opacity: rel === 0 ? 1 : visible ? 0.4 : 0,
            }}
            transition={{ duration: SHOT_S, ease: [0.16, 1, 0.3, 1] }}
            style={{ zIndex: rel === 0 ? 2 : 1 }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="70vw"
              priority={i === 0}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
