"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { AboutSection } from "@/components/landing/AboutSection";
import { spring, staggerChild, staggerParent } from "@/lib/motion";

const FEATURES = [
  {
    label: "Collateralize",
    title: "Keep your Bitcoin",
    body: "Deposit tBTC as collateral. It stays yours — non-custodial, never sold. Your treasury keeps its upside.",
  },
  {
    label: "Borrow",
    title: "Spend at 1% fixed",
    body: "Draw MUSD against your BTC at Mezo's fixed 1% rate. No floating APR, no surprise margin spikes.",
  },
  {
    label: "Stream",
    title: "Pay by the second",
    body: "Stream MUSD payroll to contributors continuously. They watch it accrue and claim anytime, in one click.",
  },
];

const ctaSpring = spring.snappy;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.span
            variants={staggerChild}
            className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-gold"
          >
            ◆ Croesus
          </motion.span>
          <motion.h1
            variants={staggerChild}
            className="bg-gradient-to-b from-[#F7E08C] via-gold to-[#9A7B1F] bg-clip-text font-hero text-hero text-transparent"
          >
            Bitcoin, unlocked.
          </motion.h1>
          <motion.p variants={staggerChild} className="mt-6 max-w-xl text-base text-text-secondary">
            A non-custodial Bitcoin treasury operating system on Mezo. Collateralize BTC, borrow MUSD at 1% fixed, and
            stream payroll to your team — without selling a single sat.
          </motion.p>
          <motion.div variants={staggerChild} className="mt-10 flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={ctaSpring}>
              <Link
                href="/app"
                className="inline-block rounded bg-gold px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(212,175,55,0.25)] transition-colors hover:bg-gold-muted"
              >
                Launch App
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={ctaSpring}>
              <Link
                href="/claim"
                className="inline-block rounded border border-border px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-overlay"
              >
                Claim Salary
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      {/* Why Croesus — scroll-parallax statue band */}
      <AboutSection />

      {/* Three modules */}
      <section className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded border border-border-subtle bg-border-subtle md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.label} delay={i} className="bg-bg-surface p-8">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{f.label}</span>
              <h3 className="mt-3 font-hero text-2xl text-text-primary">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.body}</p>
            </Reveal>
          ))}
        </div>

        {/* Hero feature: the stress test */}
        <Reveal className="mx-auto mt-12 max-w-3xl rounded border border-border-subtle bg-bg-surface p-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Runway &amp; Stress Test</span>
          <p className="mx-auto mt-4 max-w-2xl font-hero text-2xl leading-snug text-text-primary">
            Model a Bitcoin crash before it happens. Drag one slider and watch your runway, collateral ratio, and
            liquidation price update live.
          </p>
        </Reveal>
      </section>

      <footer className="border-t border-border-subtle px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-text-tertiary sm:flex-row">
          <span className="font-mono uppercase tracking-[0.2em] text-text-secondary">◆ Croesus</span>
          <span>Built on Mezo · &ldquo;Bank on Bitcoin&rdquo;</span>
          <div className="flex gap-5">
            <Link href="/app" className="transition-colors hover:text-text-secondary">
              App
            </Link>
            <Link href="/claim" className="transition-colors hover:text-text-secondary">
              Claim
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
