export function Grain() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 w-full h-full z-[45] opacity-[0.18] mix-blend-multiply"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="ih-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.92"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0.55 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#ih-noise)" />
    </svg>
  );
}
