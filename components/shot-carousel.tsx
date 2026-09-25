"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

type Photo = { src: string; alt: string };

const HOLD_MS = 2000;
const SHOT_S = 0.9;
const OFFSET_VW = 62;

export function ShotCarousel({ photos }: { photos: Photo[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Doubled so the item wrapping from far-left to far-right is never visible mid-move.
  const slides = photos.length < 4 ? [...photos, ...photos] : photos;
  const n = slides.length;

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % n),
      HOLD_MS + SHOT_S * 1000,
    );
    return () => clearInterval(id);
  }, [n, index]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) < 40) return;
    setIndex((i) => (i + (info.offset.x < 0 ? 1 : -1) + n) % n);
  }

  return (
    <motion.div
      className="shot-carousel"
      aria-roledescription="carousel"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={onDragEnd}
    >
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
              x: `${rel * OFFSET_VW}vw`,
              scale: rel === 0 ? 1 : 0.86,
              opacity: rel === 0 ? 1 : visible ? 0.55 : 0,
            }}
            transition={{
              duration: reduced ? 0.3 : SHOT_S,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ zIndex: rel === 0 ? 2 : 1 }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="75vw"
              draggable={false}
              priority={i === 0}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
