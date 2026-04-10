"use client";

/**
 * Scroll-driven 3D product reveal. A stylized MacBook sits on a dark void;
 * as the user scrolls through the section, a constellation of UI cards
 * (pricing, chart, signup form, mobile mockup, etc.) explodes outward from
 * the laptop's screen while the camera slowly dollies back. Inspired by
 * Apple / Linear product pages.
 *
 * This is the Three.js (fully procedural) variant. A frame-based variant
 * lives in `scroll-reveal-frames.tsx` and will be the drop-in replacement
 * once Veo/Whisk keyframes have been generated; swap the import in page.tsx
 * from `./scroll-reveal` to `./scroll-reveal-frames` at that point.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CARD_COUNT = 8;

// Target (exploded) positions for the UI cards at progress = 1.
// Coordinates are in local space, laptop screen origin is ~(0, 0.9, 0).
const CARD_TARGETS: [number, number, number][] = [
  [-3.6, 1.9, -0.5], // pricing (top left)
  [3.6, 1.6, -0.3], // chart (top right)
  [-2.8, -0.7, 1.2], // form (bottom left)
  [2.5, -1.2, 1.5], // mobile (bottom right)
  [-4.0, 0.3, 2.0], // landing card (mid far left)
  [4.2, 0.0, 1.8], // signup (mid far right)
  [-1.6, 2.5, 1.0], // analytics (above left)
  [2.0, 2.7, 0.5], // social post (above right)
];

// Size (w, h) of each card face
const CARD_SIZES: [number, number][] = [
  [1.1, 0.7],
  [1.2, 0.75],
  [0.9, 0.6],
  [0.7, 1.0],
  [1.1, 0.65],
  [1.0, 0.7],
  [0.85, 0.55],
  [0.95, 0.6],
];

export default function ScrollReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ----------- renderer / scene / camera ----------- */
    // Detect narrow viewports up-front — used for scene scaling + DPR cap.
    const isNarrow = () => window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Cap DPR lower on mobile to preserve battery and avoid memory pressure.
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isNarrow() ? 1.5 : 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.6, 6.2);
    camera.lookAt(0, 0.6, 0);

    /* ----------- lighting ----------- */
    // Ambient — just enough to lift the shadows from pitch black
    scene.add(new THREE.AmbientLight(0x2a2418, 0.55));

    // Warm amber key light from above-front (matches Vibr hero glow)
    const keyLight = new THREE.DirectionalLight(0xd8a870, 2.4);
    keyLight.position.set(2.5, 4, 3);
    scene.add(keyLight);

    // Cool rim/fill from behind
    const fillLight = new THREE.DirectionalLight(0x5878a0, 0.9);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);

    // Tight spot for drama directly over the laptop
    const spot = new THREE.SpotLight(0xf2efe9, 1.8, 14, Math.PI * 0.18, 0.6, 1.2);
    spot.position.set(0, 5, 2);
    spot.target.position.set(0, 0.4, 0);
    scene.add(spot);
    scene.add(spot.target);

    /* ----------- laptop group ----------- */
    // Everything (laptop + cards) lives under a worldGroup so we can scale
    // the entire scene uniformly on narrow viewports.
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const laptopGroup = new THREE.Group();
    worldGroup.add(laptopGroup);

    // Matte aluminum-ish body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1d1d1f,
      roughness: 0.45,
      metalness: 0.85,
    });

    // Base (keyboard deck)
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.11, 2.1),
      bodyMat
    );
    base.position.y = 0;
    laptopGroup.add(base);

    // Slight bevel on top of base using a thinner inset box
    const deckInset = new THREE.Mesh(
      new THREE.BoxGeometry(2.82, 0.02, 1.92),
      new THREE.MeshStandardMaterial({
        color: 0x111113,
        roughness: 0.7,
        metalness: 0.6,
      })
    );
    deckInset.position.y = 0.066;
    laptopGroup.add(deckInset);

    // Screen — recline ~100° from horizontal, hinge at back of base
    const screenGroup = new THREE.Group();
    // Hinge at the back edge of the base
    screenGroup.position.set(0, 0.055, -1.02);
    screenGroup.rotation.x = -THREE.MathUtils.degToRad(100);
    laptopGroup.add(screenGroup);

    // Screen shell
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.95, 0.09),
      bodyMat
    );
    // The screen group is now rotated around the hinge, so the shell
    // needs to extend "up" along its local Y from the hinge point.
    shell.position.y = 0.97;
    screenGroup.add(shell);

    // Screen display plane — glowy code panel (procedural canvas texture)
    const screenTex = makeCodeTexture();
    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(2.78, 1.74),
      new THREE.MeshBasicMaterial({
        map: screenTex,
        toneMapped: false,
      })
    );
    display.position.set(0, 0.97, 0.047);
    screenGroup.add(display);

    /* ----------- UI cards ----------- */
    const cardGroup = new THREE.Group();
    worldGroup.add(cardGroup);

    // Card palette — muted tones, amber-leaning
    const cardPalette = [
      0xd8a870, // amber
      0xf2efe9, // cream
      0x9a8366, // bronze
      0xbfaa85, // parchment
      0xd8a870,
      0xa8936d,
      0xf2efe9,
      0xc89c6a,
    ];

    const cards: THREE.Group[] = [];
    for (let i = 0; i < CARD_COUNT; i++) {
      const group = new THREE.Group();
      const [w, h] = CARD_SIZES[i];

      // Card back — dark panel
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 0.04),
        new THREE.MeshStandardMaterial({
          color: 0x14110e,
          roughness: 0.55,
          metalness: 0.35,
        })
      );
      group.add(back);

      // Face — procedural UI sketch
      const faceTex = makeCardTexture(i, cardPalette[i]);
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.95, h * 0.92),
        new THREE.MeshBasicMaterial({
          map: faceTex,
          transparent: true,
          toneMapped: false,
        })
      );
      face.position.z = 0.021;
      group.add(face);

      // Subtle emissive outline (thin edge frame around each card)
      const edgeGeom = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(w * 0.95, h * 0.92)
      );
      const edge = new THREE.LineSegments(
        edgeGeom,
        new THREE.LineBasicMaterial({
          color: cardPalette[i],
          transparent: true,
          opacity: 0.55,
        })
      );
      edge.position.z = 0.022;
      group.add(edge);

      cardGroup.add(group);
      cards.push(group);
    }

    // Initial card positions — all tucked into the screen display plane.
    // We store a "start" position in world coords (the screen display position)
    // and "target" in local space, then lerp each frame based on progress.
    const startPos = new THREE.Vector3();
    // Compute the world position of the display plane (front of screen)
    display.getWorldPosition(startPos);

    /* ----------- scroll/animation loop ----------- */
    let rafId = 0;
    const tmpVec = new THREE.Vector3();
    // Camera state set by resize() — declared here so the frame loop can
    // reference the same refs the resize handler mutates below.
    const cameraBaseZRef = { current: 6.2 };
    const cameraZReachRef = { current: 2.2 };

    function frame() {
      const p = progressRef.current;
      // Ease so the motion feels springy at the end
      const eased = easeOutCubic(p);

      // Cards: lerp from startPos → CARD_TARGETS[i]
      for (let i = 0; i < cards.length; i++) {
        const [tx, ty, tz] = CARD_TARGETS[i];
        cards[i].position.set(
          THREE.MathUtils.lerp(startPos.x, tx, eased),
          THREE.MathUtils.lerp(startPos.y, ty, eased),
          THREE.MathUtils.lerp(startPos.z, tz, eased)
        );
        // Also fade + rotate in subtly
        const spin = Math.sin(i * 1.7) * 0.18;
        cards[i].rotation.y = THREE.MathUtils.lerp(0, spin, eased);
        cards[i].rotation.z = THREE.MathUtils.lerp(0, Math.sin(i) * 0.08, eased);
        // Scale up from tiny to full
        const s = THREE.MathUtils.lerp(0.15, 1, eased);
        cards[i].scale.set(s, s, s);
        // Opacity fade-in on the face + edge frame (renamed to avoid
        // shadowing the enclosing `frame()` function).
        const face = cards[i].children[1] as THREE.Mesh;
        const edge = cards[i].children[2] as THREE.LineSegments;
        (face.material as THREE.MeshBasicMaterial).opacity =
          THREE.MathUtils.clamp(eased * 1.4, 0, 1);
        (face.material as THREE.MeshBasicMaterial).transparent = true;
        (edge.material as THREE.LineBasicMaterial).opacity =
          THREE.MathUtils.clamp(eased * 0.8, 0, 0.6);
      }

      // Slight laptop rotation for life
      laptopGroup.rotation.y = Math.sin(eased * Math.PI) * 0.12;
      laptopGroup.rotation.x = eased * -0.04;

      // Camera dolly back and up slightly as progress increases.
      // Uses dynamic base/reach values computed in resize() so mobile
      // viewports get a camera that's further back.
      tmpVec.set(
        Math.sin(eased * 0.4) * 0.4,
        1.6 + eased * 0.9,
        cameraBaseZRef.current + eased * cameraZReachRef.current
      );
      camera.position.lerp(tmpVec, 0.18);
      camera.lookAt(0, 0.6 + eased * 0.2, 0);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }
    frame();

    /* ----------- scroll listener ----------- */
    const section = sectionRef.current;
    function onScroll() {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const scrollable = rect.height - viewportH;
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      progressRef.current = scrollable > 0 ? scrolled / scrollable : 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ----------- resize ----------- */
    // cameraBaseZ grows on narrow/portrait viewports so the whole scene
    // still fits the frame horizontally. worldGroup.scale shrinks too, so
    // the laptop doesn't become a tiny dot in the middle of a huge void.
    function resize() {
      const rect = mount.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      // Fit factor: how wide the viewport is vs. the reference desktop
      // aspect (16:9 ~ 1.78). Clamp so we never scale up beyond desktop.
      const aspect = w / h;
      const fitFactor = THREE.MathUtils.clamp(aspect / 1.78, 0.45, 1);
      // Narrow/portrait → smaller world + pulled-back camera + wider FOV
      worldGroup.scale.setScalar(0.6 + fitFactor * 0.4); // 0.6 → 1.0
      camera.fov = THREE.MathUtils.lerp(54, 42, fitFactor); // 54° → 42°
      cameraBaseZRef.current = THREE.MathUtils.lerp(8.4, 6.2, fitFactor);
      cameraZReachRef.current = THREE.MathUtils.lerp(3.0, 2.2, fitFactor);

      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    /* ----------- cleanup ----------- */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      renderer.dispose();
      screenTex.dispose();
      // Dispose scene graph
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          ((obj as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
        }
        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    // Responsive scroll track: shorter on mobile so the scrub doesn't
    // feel endless on a phone (220vh → ~2.2 screens), desktop gets the
    // full 300vh for a more cinematic dwell.
    <section
      ref={sectionRef}
      className="relative w-full h-[220vh] md:h-[300vh]"
      aria-label="Product reveal"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div ref={mountRef} className="absolute inset-0" />
        {/* Centered caption — smaller tracking on mobile so it doesn't wrap */}
        <div className="pointer-events-none absolute inset-x-0 bottom-10 md:bottom-16 flex justify-center px-4">
          <p className="font-body text-[10px] md:text-[11px] uppercase tracking-[0.18em] md:tracking-[0.25em] text-muted text-center">
            One laptop. One prompt. One marketer.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

/** Procedural "code editor" texture for the laptop screen. */
function makeCodeTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext("2d")!;

  // Dark editor bg
  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#0a0908");
  bg.addColorStop(1, "#141110");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  // Title bar
  ctx.fillStyle = "#1a1716";
  ctx.fillRect(0, 0, c.width, 38);
  // Traffic lights
  ["#f2574b", "#f5b829", "#4cd15a"].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(22 + i * 22, 19, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sidebar
  ctx.fillStyle = "#0f0d0c";
  ctx.fillRect(0, 38, 170, c.height - 38);

  // Fake code lines
  const lineColors = [
    "#c89858", // amber
    "#8a8580", // muted
    "#f2efe9", // cream
    "#d8a870", // gold
  ];
  const startY = 70;
  const lineH = 22;
  let y = startY;
  const rng = mulberry32(42);
  for (let i = 0; i < 22; i++) {
    const indent = Math.floor(rng() * 4) * 16;
    const x = 200 + indent;
    const segments = 2 + Math.floor(rng() * 4);
    let cx = x;
    for (let s = 0; s < segments; s++) {
      const w = 30 + rng() * 140;
      const col = lineColors[Math.floor(rng() * lineColors.length)];
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.55 + rng() * 0.35;
      ctx.fillRect(cx, y, w, 8);
      cx += w + 10;
      if (cx > c.width - 40) break;
    }
    ctx.globalAlpha = 1;
    y += lineH;
    if (y > c.height - 20) break;
  }

  // Subtle warm vignette
  const vg = ctx.createRadialGradient(
    c.width / 2,
    c.height / 2,
    c.width * 0.2,
    c.width / 2,
    c.height / 2,
    c.width * 0.75
  );
  vg.addColorStop(0, "rgba(200, 152, 88, 0.08)");
  vg.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, c.width, c.height);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Procedural UI card texture — 8 variants (pricing, chart, form, etc.) */
function makeCardTexture(variant: number, accent: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  const accentHex = "#" + accent.toString(16).padStart(6, "0");

  // Card background
  ctx.fillStyle = "#0d0b09";
  ctx.fillRect(0, 0, c.width, c.height);

  // Top accent bar
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.65;
  ctx.fillRect(24, 24, 80, 4);
  ctx.globalAlpha = 1;

  // Title line
  ctx.fillStyle = "#f2efe9";
  ctx.fillRect(24, 44, 200, 12);

  // Subtitle
  ctx.fillStyle = "#8a8580";
  ctx.fillRect(24, 64, 140, 6);

  // Variant-specific body
  switch (variant % 8) {
    case 0: // pricing
      ctx.fillStyle = accentHex;
      ctx.font = "bold 64px sans-serif";
      ctx.fillText("$49", 24, 160);
      ctx.fillStyle = "#8a8580";
      ctx.font = "16px sans-serif";
      ctx.fillText("/ month", 140, 160);
      // Feature rows
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = accentHex;
        ctx.fillRect(24, 200 + i * 22, 8, 8);
        ctx.fillStyle = "#8a8580";
        ctx.fillRect(40, 200 + i * 22, 180 + i * 10, 6);
      }
      break;
    case 1: // chart (bars)
      {
        const bars = 10;
        for (let i = 0; i < bars; i++) {
          const h = 30 + Math.sin(i * 0.7) * 40 + 70;
          ctx.fillStyle = accentHex;
          ctx.globalAlpha = 0.5 + (i / bars) * 0.5;
          ctx.fillRect(24 + i * 44, 280 - h, 30, h);
        }
        ctx.globalAlpha = 1;
      }
      break;
    case 2: // form
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = "#3a3530";
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 110 + i * 56, c.width - 48, 40);
        ctx.fillStyle = "#4a4540";
        ctx.fillRect(36, 124 + i * 56, 90 + i * 20, 10);
      }
      // Submit button
      ctx.fillStyle = accentHex;
      ctx.fillRect(24, 280, 140, 30);
      break;
    case 3: // mobile mockup (phone)
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 3;
      ctx.strokeRect(180, 90, 150, 210);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? accentHex : "#8a8580";
        ctx.globalAlpha = 0.7;
        ctx.fillRect(196, 110 + i * 30, 120 - i * 8, 8);
      }
      ctx.globalAlpha = 1;
      break;
    case 4: // landing (hero blocks)
      ctx.fillStyle = accentHex;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(24, 100, 260, 18);
      ctx.fillRect(24, 124, 200, 18);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#f2efe9";
      ctx.fillRect(24, 156, 340, 6);
      ctx.fillRect(24, 170, 300, 6);
      ctx.fillRect(24, 184, 320, 6);
      ctx.globalAlpha = 1;
      ctx.fillStyle = accentHex;
      ctx.fillRect(24, 230, 120, 32);
      break;
    case 5: // signup card
      ctx.fillStyle = "#f2efe9";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("Sign in", 24, 140);
      ctx.strokeStyle = "#3a3530";
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 170, c.width - 48, 44);
      ctx.fillStyle = accentHex;
      ctx.fillRect(24, 230, c.width - 48, 44);
      ctx.fillStyle = "#0d0b09";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Continue with Google", 42, 258);
      break;
    case 6: // analytics (line graph)
      {
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pts = 14;
        for (let i = 0; i < pts; i++) {
          const x = 24 + (i * (c.width - 48)) / (pts - 1);
          const y = 240 - (Math.sin(i * 0.6) * 40 + i * 5);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        // Dot at the end
        ctx.fillStyle = accentHex;
        ctx.beginPath();
        ctx.arc(c.width - 24, 240 - (Math.sin(13 * 0.6) * 40 + 13 * 5), 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 7: // social post
      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.arc(52, 132, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f2efe9";
      ctx.fillRect(92, 118, 140, 10);
      ctx.fillStyle = "#8a8580";
      ctx.fillRect(92, 134, 80, 6);
      // Post body
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "#3a3530";
        ctx.fillRect(24, 180 + i * 18, (c.width - 48) - i * 30, 8);
      }
      break;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Deterministic PRNG so the code texture doesn't re-roll on HMR */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
