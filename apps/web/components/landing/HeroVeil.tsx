"use client";

import { useReducedMotion } from "framer-motion";
import DarkVeil from "@/components/motion/DarkVeil";

/**
 * Landing-hero backdrop: the React Bits <DarkVeil /> shader kept deep and dark — a faint warm
 * sheen drifting behind the type, not a glow. A near-black radial scrim (darkest through the
 * centre) keeps the headline crisp on black for an understated, premium feel.
 *
 * Scoped to the marketing hero only; the data-heavy /app pages keep the GPU-cheap
 * <AuroraBackground />. Honours prefers-reduced-motion with a static, subtle warm glow.
 */
export function HeroVeil() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 isolate overflow-hidden">
      {reduce ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 32%, rgba(212,175,55,0.12), transparent 70%)",
          }}
        />
      ) : (
        <>
          {/* Faint, slow shader texture — kept dark so it never reads as a smear. */}
          <div
            className="absolute inset-0 opacity-40"
            style={{ filter: "brightness(0.85) saturate(1.15)" }}
          >
            <DarkVeil
              speed={0.3}
              hueShift={35}
              warpAmount={0.05}
              noiseIntensity={0}
              scanlineIntensity={0}
              scanlineFrequency={0}
              resolutionScale={1}
            />
          </div>
          {/* Gentle gold warmth — soft-light, not a flat fill. */}
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{ backgroundColor: "#D4AF37", opacity: 0.55 }}
          />
        </>
      )}

      {/* Deep near-black scrim, darkest through the centre so the type stays crisp. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 90% at 50% 38%, rgba(0,0,0,0.70), rgba(0,0,0,0.85) 58%, #000 96%)",
        }}
      />
    </div>
  );
}
