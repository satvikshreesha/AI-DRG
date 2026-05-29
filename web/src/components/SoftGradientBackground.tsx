import { useEffect, useRef, type CSSProperties } from "react";

type Phase = "thinking" | "settled";

type BlobConfig = {
  name: string;
  color: string;
  hot: string;
  x: number;
  y: number;
  size: number;
  stretch: number;
  rotation: number;
  alpha: number;
  glow: number;
  hotX: number;
  hotY: number;
  phase: number;
};

const DEFAULT_SETTINGS = {
  background: "var(--color-parchment)",
  blur: 13,
  saturation: 0.91,
  contrast: 1.3,
  grainOpacity: 0.54,
  grainSize: 1.6,
  vignette: 0.07,
  speed: 0.53,
  drift: 32,
  wobble: 0.55,
  orbitSpeed: 0.34,
  orbitRadiusScale: 0.5,
  blobScale: 0.9,
  blendMode: "soft-light",
};

const SCENE_OFFSET = {
  x: 50,
  y: 100,
};

const DEFAULT_BLOBS: BlobConfig[] = [
  {
    name: "pink mist",
    color: "#8aa5e5",
    hot: "#9eb5e6",
    x: 31.5,
    y: 40.5,
    size: 39,
    stretch: 1.26,
    rotation: 38,
    alpha: 0.5,
    glow: 0.58,
    hotX: 42,
    hotY: 32,
    phase: 0.4,
  },
  {
    name: "cobalt pool",
    color: "#5789ff",
    hot: "#2e3cff",
    x: 64.5,
    y: 34.5,
    size: 58,
    stretch: 0.65,
    rotation: 28,
    alpha: 0.5,
    glow: 0.42,
    hotX: 54,
    hotY: 58,
    phase: 1.8,
  },

  {
    name: "peach bloom",
    color: "#bdc1ff",
    hot: "#8fbfff",
    x: 60,
    y: 75,
    size: 38.5,
    stretch: 1.6,
    rotation: -42,
    alpha: 0.5,
    glow: 0.6,
    hotX: 44,
    hotY: 42,
    phase: 4.2,
  },
];

const ORBIT_CENTER = {
  cx: DEFAULT_BLOBS.reduce((sum, b) => sum + b.x, 0) / DEFAULT_BLOBS.length,
  cy: DEFAULT_BLOBS.reduce((sum, b) => sum + b.y, 0) / DEFAULT_BLOBS.length,
};

const ORBIT_BLOB_PARAMS = DEFAULT_BLOBS.map((blob, index) => {
  const dx = blob.x - ORBIT_CENTER.cx;
  const dy = blob.y - ORBIT_CENTER.cy;
  return {
    radius: Math.hypot(dx, dy),
    baseAngle: Math.atan2(dy, dx),
    speedFactor: 0.88 + index * 0.06,
  };
});

const MOTION_SMOOTH = 0.014;

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(
    clean.length === 3 ? clean.replace(/./g, "$&$&") : clean,
    16
  );
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyBlobStyles(node: HTMLDivElement, blob: BlobConfig) {
  const { blobScale } = DEFAULT_SETTINGS;
  node.style.setProperty("--size", String(blob.size * blobScale));
  node.style.setProperty("--stretch", String(blob.stretch));
  node.style.setProperty("--rotation", String(blob.rotation));
  node.style.setProperty("--alpha", String(blob.alpha));
  node.style.setProperty("--glow", String(blob.glow));
  node.style.setProperty("--hot-x", `${blob.hotX}%`);
  node.style.setProperty("--hot-y", `${blob.hotY}%`);
  node.style.setProperty("--color", blob.color);
  node.style.setProperty("--hot", blob.hot);
  node.style.setProperty("--wash", hexToRgba(blob.color, 0.28));
}

function applyEntranceStyles(node: HTMLDivElement, blob: BlobConfig) {
  node.style.setProperty("--x", String(blob.x));
  node.style.setProperty("--y", String(blob.y));
}

function applySceneStyles(root: HTMLDivElement, settings = DEFAULT_SETTINGS) {
  root.style.setProperty("--paper", settings.background);
  root.style.setProperty("--blur", `${settings.blur}px`);
  root.style.setProperty("--saturation", String(settings.saturation));
  root.style.setProperty("--contrast", String(settings.contrast));
  root.style.setProperty("--grain-opacity", String(settings.grainOpacity));
  root.style.setProperty("--grain-size", `${settings.grainSize}px`);
  root.style.setProperty("--vignette", String(settings.vignette));
  root.style.setProperty("--blob-blend", settings.blendMode);
}

export function SoftGradientBackground({ phase }: { phase: Phase }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLElement>(null);
  const entranceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const motionState = useRef(
    DEFAULT_BLOBS.map((blob) => ({
      dx: 0,
      dy: 0,
      rot: blob.rotation,
      scale: DEFAULT_SETTINGS.blobScale,
      hotDx: 0,
      hotDy: 0,
    }))
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    DEFAULT_BLOBS.forEach((blob, index) => {
      const entrance = entranceRefs.current[index];
      const node = blobRefs.current[index];
      if (entrance) applyEntranceStyles(entrance, blob);
      if (node) applyBlobStyles(node, blob);
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    applySceneStyles(stage);
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;

    const animate = (time: number) => {
      if (!reducedMotion.matches) {
        const t = time * 0.001;
        const { speed, drift, wobble, orbitSpeed, orbitRadiusScale, blobScale } =
          DEFAULT_SETTINGS;
        const pace = speed * 0.22;
        const orbitPace = pace * orbitSpeed;

        const fieldX = Math.sin(t * pace * 0.18) * drift * 0.45;
        const fieldY = Math.cos(t * pace * 0.15 + 0.8) * drift * 0.35;
        field.style.transform = `translate3d(${fieldX}px, ${fieldY}px, 0)`;

        DEFAULT_BLOBS.forEach((blob, index) => {
          const entrance = entranceRefs.current[index];
          const node = blobRefs.current[index];
          const m = motionState.current[index];
          const orbit = ORBIT_BLOB_PARAMS[index];
          if (!entrance || !node || !m || !orbit) return;

          const p = blob.phase;
          const orbitAngle =
            orbit.baseAngle +
            t * orbitPace * orbit.speedFactor +
            p * 0.18;
          const orbitX =
            ORBIT_CENTER.cx +
            orbit.radius * orbitRadiusScale * Math.cos(orbitAngle);
          const orbitY =
            ORBIT_CENTER.cy +
            orbit.radius * orbitRadiusScale * Math.sin(orbitAngle);

          entrance.style.setProperty("--x", String(orbitX));
          entrance.style.setProperty("--y", String(orbitY));

          const targetDx =
            Math.sin(t * pace + p) * drift +
            Math.sin(t * pace * 0.41 + p * 2.2) * drift * 0.28;
          const targetDy =
            Math.cos(t * pace * 0.71 + p * 1.35) * drift +
            Math.cos(t * pace * 0.36 + p * 0.85) * drift * 0.24;
          const targetRot =
            blob.rotation + Math.sin(t * pace * 0.48 + p) * drift * 0.22;
          const targetScale =
            blobScale +
            Math.sin(t * pace * 0.33 + p * 1.7) * 0.012 * (drift / 5);
          const targetHotDx = Math.sin(t * pace * 0.27 + p) * 3.5 * wobble;
          const targetHotDy = Math.cos(t * pace * 0.24 + p * 1.4) * 3.5 * wobble;

          m.dx += (targetDx - m.dx) * MOTION_SMOOTH;
          m.dy += (targetDy - m.dy) * MOTION_SMOOTH;
          m.rot += (targetRot - m.rot) * MOTION_SMOOTH;
          m.scale += (targetScale - m.scale) * MOTION_SMOOTH;
          m.hotDx += (targetHotDx - m.hotDx) * MOTION_SMOOTH;
          m.hotDy += (targetHotDy - m.hotDy) * MOTION_SMOOTH;

          const radiusA = 52 + Math.sin(t * pace * 0.55 + p) * wobble * 10;
          const radiusB = 48 + Math.cos(t * pace * 0.47 + p) * wobble * 8;

          node.style.transform = `
            translate3d(${m.dx}px, ${m.dy}px, 0)
            rotate(${m.rot}deg)
            scale(${m.scale})
          `;
          node.style.borderRadius = `${radiusA}% ${radiusB}% ${58 - radiusB / 8}% ${42 + radiusA / 12}% / ${47 + radiusB / 10}% ${55 - radiusA / 9}% ${45 + radiusA / 12}% ${53 - radiusB / 11}%`;
          node.style.setProperty("--hot-x", `${blob.hotX + m.hotDx}%`);
          node.style.setProperty("--hot-y", `${blob.hotY + m.hotDy}%`);
        });
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      ref={stageRef}
      className="soft-gradient-stage"
      data-phase={phase}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        transform: `translate(${SCENE_OFFSET.x}px, ${SCENE_OFFSET.y}px)`,
      }}
    >
      <section ref={fieldRef} className="soft-gradient-blob-field">
        {DEFAULT_BLOBS.map((blob, index) => (
          <div
            key={blob.name}
            ref={(node) => {
              entranceRefs.current[index] = node;
            }}
            className="soft-gradient-blob-entrance"
            style={{ "--blob-index": index } as CSSProperties}
          >
            <div
              ref={(node) => {
                blobRefs.current[index] = node;
              }}
              className="soft-gradient-blob"
              data-name={blob.name}
            />
          </div>
        ))}
      </section>
      <div className="soft-gradient-paper-fog" />
      <div className="soft-gradient-grain" />
    </div>
  );
}
