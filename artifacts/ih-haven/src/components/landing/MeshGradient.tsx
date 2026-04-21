/**
 * Animated mesh-gradient backdrop — three large blurred color blobs that
 * drift slowly. The signature visual texture of Vercel, Linear, and Arc.
 * Sits fixed behind all content. Pure CSS, GPU-accelerated.
 */
export function MeshGradient() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ contain: "strict" }}
    >
      {/* Base radial vignette — deepens edges, lifts center subtly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, hsl(265 50% 12% / 0.6) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 50% 100%, hsl(190 50% 10% / 0.5) 0%, transparent 60%)",
        }}
      />

      {/* Violet blob — top-right */}
      <div
        className="mesh-blob-1 absolute -top-[20%] -right-[15%] w-[70vw] h-[70vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(265 95% 55% / 0.45) 0%, hsl(265 95% 55% / 0) 60%)",
          filter: "blur(80px)",
          willChange: "transform",
        }}
      />

      {/* Cyan blob — bottom-left */}
      <div
        className="mesh-blob-2 absolute -bottom-[25%] -left-[20%] w-[75vw] h-[75vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(190 100% 50% / 0.35) 0%, hsl(190 100% 50% / 0) 60%)",
          filter: "blur(90px)",
          willChange: "transform",
        }}
      />

      {/* Magenta blob — center */}
      <div
        className="mesh-blob-3 absolute top-[30%] left-[20%] w-[55vw] h-[55vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(320 95% 55% / 0.25) 0%, hsl(320 95% 55% / 0) 60%)",
          filter: "blur(100px)",
          willChange: "transform",
        }}
      />

      {/* Top fade to true black — gives header crisp contrast */}
      <div
        className="absolute inset-x-0 top-0 h-[40vh]"
        style={{
          background:
            "linear-gradient(to bottom, hsl(240 30% 3%) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
