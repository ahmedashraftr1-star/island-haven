import { useEffect, useRef, useState } from "react";

const photos = [
  "/photos/IMG_8344.webp",
  "/photos/IMG_8347.webp",
  "/photos/IMG_8352.webp",
  "/photos/IMG_8358.webp",
  "/photos/IMG_8300.webp",
  "/photos/IMG_8313.webp",
  "/photos/IMG_8341.webp",
  "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp",
  "/photos/IMG_8356.webp",
];

const MIN_DIST = 110; // px between drops
const LIFETIME = 900; // ms each image lives
const MAX_VISIBLE = 8;

type Drop = {
  id: number;
  x: number;
  y: number;
  src: string;
  rot: number;
};

export function CursorImageTrail() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const last = useRef({ x: -9999, y: -9999 });
  const counter = useRef(0);
  const photoIdx = useRef(0);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      setTouch(true);
      return;
    }
    if (window.innerWidth < 1024) {
      setTouch(true);
      return;
    }

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_DIST) return;

      // skip when over interactive elements that already have hover effects
      const t = e.target as HTMLElement | null;
      if (t && t.closest('a, button, input, textarea, select, [data-no-trail]'))
        return;

      last.current = { x: e.clientX, y: e.clientY };
      const id = ++counter.current;
      const src = photos[photoIdx.current % photos.length];
      photoIdx.current++;
      const rot = (Math.random() - 0.5) * 12;

      setDrops((prev) => {
        const next = [...prev, { id, x: e.clientX, y: e.clientY, src, rot }];
        // cap visible count
        return next.slice(-MAX_VISIBLE);
      });

      window.setTimeout(() => {
        setDrops((prev) => prev.filter((d) => d.id !== id));
      }, LIFETIME);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (touch) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
      style={{ mixBlendMode: "normal" }}
    >
      {drops.map((d) => (
        <img
          key={d.id}
          src={d.src}
          alt=""
          className="absolute"
          style={{
            left: d.x,
            top: d.y,
            width: 220,
            height: 280,
            objectFit: "cover",
            transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
            animation: `ih-trail ${LIFETIME}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            willChange: "transform, opacity, clip-path",
          }}
        />
      ))}
      <style>{`
        @keyframes ih-trail {
          0% {
            opacity: 0;
            clip-path: inset(50% 0 50% 0);
            transform: translate(-50%, -50%) rotate(var(--r, 0deg)) scale(0.94);
          }
          18% {
            opacity: 1;
            clip-path: inset(0% 0 0% 0);
            transform: translate(-50%, -50%) rotate(var(--r, 0deg)) scale(1);
          }
          70% {
            opacity: 1;
            clip-path: inset(0% 0 0% 0);
          }
          100% {
            opacity: 0;
            clip-path: inset(0 0 100% 0);
            transform: translate(-50%, -55%) rotate(var(--r, 0deg)) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
