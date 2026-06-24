"use client";

import { useEffect, useState } from "react";

/**
 * Full-bleed hero background: 3 cross-fading photo slides (newzealand.com style)
 * with a slow Ken-Burns zoom, a dark gradient for text legibility, and clickable
 * dots. Auto-advances every 5s; clicking a dot jumps and resets the timer.
 *
 * The hero copy + AskAI bar are passed as `children` and overlaid above the
 * gradient (server-rendered, so the live Q&A widget keeps working inside).
 */
export function HeroSlideshow({
  images,
  credit,
  children,
}: {
  images: string[];
  credit?: string;
  children: React.ReactNode;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <section className="relative min-h-[86vh] flex items-end overflow-hidden">
      {images.map((src, idx) => (
        <div
          key={src}
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms] ease-in-out hero-kenburns"
          style={{ backgroundImage: `url('${src}')`, opacity: idx === i ? 1 : 0 }}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(8,30,22,.86) 0%, rgba(8,30,22,.30) 42%, rgba(8,30,22,.10) 70%, rgba(8,30,22,.28) 100%)",
        }}
      />

      <div className="absolute left-0 right-0 bottom-6 z-[3] flex justify-center gap-2.5">
        {images.map((src, idx) => (
          <button
            key={src}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-[9px] rounded-full transition-all duration-200 ${
              idx === i ? "w-7 bg-white" : "w-[9px] bg-white/45 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      <div className="relative z-[2] w-full max-w-[1300px] mx-auto px-6 sm:px-8 pb-16 sm:pb-20">
        {children}
      </div>

      {credit ? (
        <span className="absolute right-5 bottom-3.5 z-[2] text-[11px] text-white/50">
          {credit}
        </span>
      ) : null}
    </section>
  );
}
