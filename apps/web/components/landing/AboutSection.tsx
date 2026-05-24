"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import ScrollFloat from "@/components/motion/ScrollFloat";
import TextType from "@/components/motion/TextType";

/**
 * "Why Croesus" — a full-bleed editorial band that reuses the photo's own composition:
 * the marble statue sits to the right, the headline lives in its natural left-hand darkness.
 * As the section scrolls through the viewport the statue rises and scales up ("pops up"),
 * and a gold texture veil sweeps upward from the base. Fully static under prefers-reduced-motion.
 */
export function AboutSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Image drifts and settles as the band passes through the viewport.
  const y = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [1.18, 1]);
  const imageStyle = reduce ? undefined : { y, scale };

  // Gold "texture" veil that sweeps upward as you read into the section.
  const veilOpacity = useTransform(scrollYProgress, [0.1, 0.55], [0.6, 0]);

  return (
    <section
      ref={ref}
      aria-label="Why Croesus"
      className="relative overflow-hidden border-t border-border-subtle"
    >
      <div className="relative min-h-[80vh] md:min-h-[92vh]">
        {/* Parallax statue */}
        <motion.div style={imageStyle} className="absolute inset-0">
          <Image
            src="/croesus-statue.jpg"
            alt="Marble statue of a robed thinker holding a scroll, lit against deep shadow."
            fill
            sizes="100vw"
            className="object-cover object-[68%_center]"
            priority={false}
          />
        </motion.div>

        {/* Left-to-right scrim — mirrors the photo's own negative space and keeps the copy legible on every screen. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent"
        />
        {/* Upward gold texture veil, tied to scroll. */}
        <motion.div
          aria-hidden
          style={{ opacity: reduce ? 0.18 : veilOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gold/15 via-gold/5 to-transparent"
        />
        {/* Seam into the next section. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent"
        />

        {/* Copy, anchored in the dark left third. */}
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center px-6 md:min-h-[92vh]">
          <div className="max-w-lg">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
                ◆ Why Croesus
              </span>
            </Reveal>
            <ScrollFloat
              containerClassName="mt-6"
              textClassName="!font-hero !text-4xl md:!text-6xl !font-light !leading-[1.3] !text-left text-text-primary"
              animationDuration={1.2}
              ease="power3.out"
              stagger={0.05}
              scrollStart="top bottom"
              scrollEnd="bottom center"
            >
              Wealth that holds its ground.
            </ScrollFloat>
            <Reveal delay={1}>
              <TextType
                as="p"
                className="mt-5 font-mono text-sm uppercase tracking-[0.25em] text-gold"
                text={[
                  "Keep your Bitcoin.",
                  "Borrow at 1% fixed.",
                  "Stream by the second.",
                  "Never sell a sat.",
                ]}
                typingSpeed={95}
                deletingSpeed={45}
                pauseDuration={3200}
                startOnVisible
                cursorClassName="text-gold"
              />
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-6 text-base leading-relaxed text-text-secondary">
                Croesus, the last king of Lydia, struck the world&rsquo;s first coins of pure gold —
                and his name has meant fortune ever since. The lesson outlived the empire: real
                wealth is never spent away, it&rsquo;s put to work.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                We brought that to Bitcoin. Your sats stay yours — working as collateral beneath a
                treasury you actually operate. Borrow at 1% fixed, stream payroll by the second, and
                stress-test a crash before it arrives. Never sell a single sat.
              </p>
            </Reveal>
            <Reveal delay={4}>
              <Link
                href="/app"
                className="mt-9 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:text-gold-muted"
              >
                See how it works
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
