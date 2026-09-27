"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

export function AnthemVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced || userPaused) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced, userPaused]);

  function togglePlay() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => {});
    } else {
      setUserPaused(true);
      video.pause();
    }
  }

  function toggleSound() {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) {
      setUserPaused(false);
      video.play().catch(() => {});
    }
  }

  return (
    <div className="anthem-frame">
      <video
        ref={ref}
        src="/video/baddies-in-belgica.mp4"
        poster="/video/baddies-in-belgica-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Videoclip Baddies in Belgica, met de Baddies Tee"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
      />
      <div className="anthem-controls">
        <button onClick={togglePlay} aria-label={playing ? "Pauzeer video" : "Speel video af"}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={toggleSound} aria-label={muted ? "Geluid aan" : "Geluid uit"}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span>{muted ? "GELUID AAN" : "GELUID UIT"}</span>
        </button>
      </div>
    </div>
  );
}
