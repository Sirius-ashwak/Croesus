import Link from "next/link";

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

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-gold">◆ Croesus</span>
        <h1 className="font-hero text-hero text-gold">Bitcoin, unlocked.</h1>
        <p className="mt-6 max-w-xl text-base text-text-secondary">
          A non-custodial Bitcoin treasury operating system on Mezo. Collateralize BTC, borrow MUSD at 1% fixed, and
          stream payroll to your team — without selling a single sat.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/app"
            className="rounded bg-gold px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-muted"
          >
            Launch App
          </Link>
          <Link
            href="/claim"
            className="rounded border border-border px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-overlay"
          >
            Claim Salary
          </Link>
        </div>
      </main>

      {/* Three modules */}
      <section className="border-t border-border-subtle px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded border border-border-subtle bg-border-subtle md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-bg-surface p-8">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{f.label}</span>
              <h3 className="mt-3 font-hero text-2xl text-text-primary">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Hero feature: the stress test */}
        <div className="mx-auto mt-12 max-w-3xl rounded border border-border-subtle bg-bg-surface p-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Runway &amp; Stress Test</span>
          <p className="mx-auto mt-4 max-w-2xl font-hero text-2xl leading-snug text-text-primary">
            Model a Bitcoin crash before it happens. Drag one slider and watch your runway, collateral ratio, and
            liquidation price update live.
          </p>
        </div>
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
