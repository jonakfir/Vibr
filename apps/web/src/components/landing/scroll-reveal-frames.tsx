"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 240;
const FRAME_PATH = (i: number) =>
  `/hero-frames/frame_${String(i).padStart(4, "0")}.webp`;

// How "tall" the scroll track is, as a multiple of viewport height.
// 3× viewport = about 3 full scrolls to play the whole sequence.
const TRACK_VH = 300;

export default function ScrollReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [firstFrameMissing, setFirstFrameMissing] = useState(false);

  // Probe frame_0001 once to decide whether frames have been generated yet.
  // If not, we render a graceful fallback and never mount the heavy preloader.
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setEnabled(true);
    probe.onerror = () => setFirstFrameMissing(true);
    probe.src = FRAME_PATH(1);
  }, []);

  // Preload all frames once enabled.
  useEffect(() => {
    if (!enabled) return;
    framesRef.current = new Array(TOTAL_FRAMES).fill(null);
    let cancelled = false;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        if (cancelled) return;
        framesRef.current[i - 1] = img;
        setLoadedCount((n) => n + 1);
        // As soon as frame 1 is in, draw it so the canvas isn't blank.
        if (i === 1) drawFrame(0);
      };
      img.onerror = () => {
        if (cancelled) return;
        // Missing frame — just count it so the loader doesn't hang.
        setLoadedCount((n) => n + 1);
      };
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Resize canvas to device pixel ratio for crisp rendering.
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(currentFrameRef.current);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [enabled]);

  // Scroll listener — computes progress through the section and draws the
  // corresponding frame via rAF.
  useEffect(() => {
    if (!enabled) return;
    const section = sectionRef.current;
    if (!section) return;

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const rect = section.getBoundingClientRect();
        const viewportH = window.innerHeight;
        // Progress 0 → 1 over the scroll track length minus the sticky height.
        const scrollable = rect.height - viewportH;
        const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
        const progress = scrollable > 0 ? scrolled / scrollable : 0;
        const frameIndex = Math.min(
          TOTAL_FRAMES - 1,
          Math.floor(progress * (TOTAL_FRAMES - 1))
        );
        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Walk backwards from the requested frame until we find a loaded one —
    // prevents flicker-to-black while mid-range frames are still preloading.
    let img: HTMLImageElement | null = null;
    for (let i = index; i >= 0; i--) {
      const candidate = framesRef.current[i];
      if (candidate) {
        img = candidate;
        break;
      }
    }
    if (!img) return;
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    ctx.clearRect(0, 0, cw, ch);
    // Object-fit: contain — preserve aspect ratio inside the canvas box.
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // If frames haven't been generated yet, render nothing so the landing page
  // still looks complete. You can delete this guard once frames are in place.
  if (firstFrameMissing) return null;

  const loadProgress = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  const ready = loadedCount >= Math.min(30, TOTAL_FRAMES); // show after first 30 decode

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${TRACK_VH}vh` }}
      aria-label="Product reveal"
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            opacity: ready ? 1 : 0,
            transition: "opacity 600ms ease-out",
          }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">
              Loading reveal… {loadProgress}%
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
