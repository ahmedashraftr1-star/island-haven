import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * "Where we are" — a hand-drawn stylised SVG of the Gaza Strip's coastline
 * with a pulsing pin marking Island Haven's location. No external maps,
 * no satellite imagery. Just a calm, intimate love letter to the city.
 *
 * The strip is rendered as a soft indigo silhouette tracing the
 * Mediterranean coast NE-SW, with a sea ripple line behind it and a
 * heartbeat pulse at the haven's pin.
 */
export function GazaPulseMap({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label={t({ ar: "خريطة قطاع غزّة", en: "Map of the Gaza Strip" })}
      >
        {/* Sea ripple background — three soft horizontal lines (cool accent: it's the Mediterranean / data context) */}
        <g stroke="hsl(199 90% 58%)" strokeWidth="1" strokeLinecap="round" opacity="0.32">
          <motion.path
            d="M 30 70 Q 80 64 130 70 T 230 70 T 300 68"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <motion.path
            d="M 30 92 Q 80 86 130 92 T 230 92 T 300 90"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }}
          />
          <motion.path
            d="M 30 114 Q 80 108 130 114 T 230 114 T 300 112"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
          />
        </g>

        {/* Compass rose, top-right */}
        <g transform="translate(280, 40)" opacity="0.55">
          <circle cx="0" cy="0" r="14" stroke="hsl(199 70% 60%)" strokeWidth="0.8" fill="none" />
          <path d="M 0 -10 L 0 10 M -10 0 L 10 0" stroke="hsl(199 70% 60%)" strokeWidth="0.8" />
          <text x="0" y="-16" textAnchor="middle" fontSize="9" fill="hsl(199 80% 68%)" fontWeight="600">N</text>
        </g>

        {/* Gaza Strip silhouette — stylised, coastal, NE→SW.
            Drawn as a thin diagonal landform with the coast on its NW edge. */}
        <motion.path
          d="
            M 230 130
            L 250 144
            L 240 168
            L 220 188
            L 196 206
            L 168 224
            L 138 238
            L 108 248
            L 82 252
            L 70 244
            L 58 232
            L 64 216
            L 84 198
            L 110 180
            L 138 164
            L 168 150
            L 198 140
            Z
          "
          fill="hsl(354 60% 50%)"
          fillOpacity="0.16"
          stroke="hsl(354 78% 60%)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ pathLength: 0, fillOpacity: 0 }}
          whileInView={{ pathLength: 1, fillOpacity: 0.16 }}
          viewport={{ once: true }}
          transition={{
            pathLength: { duration: 2, ease: [0.16, 1, 0.3, 1] },
            fillOpacity: { delay: 1.2, duration: 0.8 },
          }}
        />

        {/* Inner texture — subtle parallel hatching for the strip */}
        <g stroke="hsl(354 70% 52%)" strokeWidth="0.6" opacity="0.18">
          <motion.path
            d="M 100 220 L 140 200 M 130 230 L 170 210 M 160 240 L 200 220 M 190 224 L 230 204"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.4, duration: 1, ease: "easeOut" }}
          />
        </g>

        {/* City label */}
        <motion.text
          x="138"
          y="266"
          textAnchor="middle"
          fontSize="11"
          fill="hsl(210 24% 92%)"
          fontWeight="700"
          letterSpacing="0.5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.6, duration: 0.6 }}
        >
          {t({ ar: "غزّة · GAZA", en: "GAZA" })}
        </motion.text>

        {/* Haven pin with concentric pulse */}
        <g transform="translate(138, 200)">
          <motion.circle
            r="6"
            fill="hsl(354 70% 52%)"
            opacity="0.4"
            initial={{ scale: 0 }}
            whileInView={{ scale: [0, 5, 5] }}
            viewport={{ once: true }}
            transition={{ delay: 1.8, duration: 2.4, repeat: Infinity, ease: "easeOut", times: [0, 0.5, 1] }}
            style={{ originX: "0.5", originY: "0.5", transformBox: "fill-box" }}
          />
          <motion.circle
            r="6"
            fill="hsl(354 70% 52%)"
            opacity="0.6"
            initial={{ scale: 0 }}
            whileInView={{ scale: [0, 3.2, 3.2] }}
            viewport={{ once: true }}
            transition={{ delay: 2.0, duration: 2.4, repeat: Infinity, ease: "easeOut", times: [0, 0.5, 1] }}
            style={{ originX: "0.5", originY: "0.5", transformBox: "fill-box" }}
          />
          <motion.circle
            r="5.5"
            fill="hsl(354 70% 52%)"
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.text
            x="14"
            y="4"
            fontSize="10.5"
            fill="hsl(354 82% 72%)"
            fontWeight="700"
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 14 }}
            viewport={{ once: true }}
            transition={{ delay: 2.4, duration: 0.5 }}
          >
            Island Haven
          </motion.text>
        </g>
      </svg>
    </div>
  );
}
