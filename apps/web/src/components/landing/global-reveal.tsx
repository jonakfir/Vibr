"use client";

/**
 * Global scroll-driven product reveal.
 *
 * A fixed canvas layer that sits behind all page content. As the user scrolls
 * through the entire landing page, the canvas advances through 192 pre-rendered
 * Veo keyframes of the MacBook + UI cards exploding outward. By the time the
 * user reaches the closing section, the explosion is fully played out.
 *
 * Frames live in /public/hero-frames/frame_NNNN.jpg.
 */

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 192;
const FRAME_PATH = (i: number) =>
  `/hero-frames/frame_${String(i).padStart(4, "0")}.jpg`;

export default function GlobalReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [firstFrameMissing, setFirstFrameMissing] = useState(false);

  // Probe frame_0001 once. If missing, bail out cleanly.
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setEnabled(true);
    probe.onerror = () => setFirstFrameMissing(true);
    probe.src = FRAME_PATH(1);
  }, []);

  // Preload all frames.
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
        if (i === 1) drawFrame(0);
      };
      img.onerror = () => {
        if (cancelled) return;
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

  // Global scroll → frame index.
  // Progress is calculated over the ENTIRE document scroll range, so the
  // explosion plays out across the whole landing page, not a single section.
  useEffect(() => {
    if (!enabled) return;

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        const progress =
          scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
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

    // Walk backwards from requested index to find a loaded frame — prevents
    // flicker-to-black while mid-range frames are still preloading.
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

    // object-fit: cover
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Frames haven't been generated yet — render nothing, page still looks fine.
  if (firstFrameMissing) return null;

  // Show the canvas as soon as ~15% of frames are loaded.
  const ready = loadedCount >= Math.max(8, Math.floor(TOTAL_FRAMES * 0.15));

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 900ms ease-out",
        }}
      />
    </div>
  );
}
