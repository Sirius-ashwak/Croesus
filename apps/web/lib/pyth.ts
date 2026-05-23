import { BTC_USD_PRICE_ID } from "./contracts";

/**
 * Pyth BTC/USD price (PRD §11.1), pull-oracle model via Hermes.
 * mocks-first: if NEXT_PUBLIC_DEMO_BTC_PRICE_USD is set, returns that price and skips the
 * network call (R-02). Falls back to a hardcoded price if Hermes is unreachable.
 */
const HERMES_LATEST = "https://hermes.pyth.network/v2/updates/price/latest";
const FALLBACK_PRICE = 74_800;

export interface BtcPrice {
  price: number;
  confidence: number;
  publishTime: number;
  isMock: boolean;
}

function demoOverride(): number | null {
  const demo = process.env.NEXT_PUBLIC_DEMO_BTC_PRICE_USD;
  if (demo && demo.length > 0) return Number(demo);
  return null;
}

export async function getBTCPriceUSD(): Promise<BtcPrice> {
  const demo = demoOverride();
  if (demo !== null) {
    return { price: demo, confidence: 0, publishTime: Math.floor(Date.now() / 1000), isMock: true };
  }
  try {
    const id = BTC_USD_PRICE_ID.replace(/^0x/, "");
    const res = await fetch(`${HERMES_LATEST}?ids[]=${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Hermes ${res.status}`);
    const data = await res.json();
    const p = data?.parsed?.[0]?.price;
    if (!p) throw new Error("no price in Hermes response");
    const scale = Math.pow(10, p.expo);
    return {
      price: Number(p.price) * scale,
      confidence: Number(p.conf) * scale,
      publishTime: p.publish_time,
      isMock: false,
    };
  } catch {
    return { price: FALLBACK_PRICE, confidence: 0, publishTime: Math.floor(Date.now() / 1000), isMock: true };
  }
}

/** Polls every 30s (PRD §11.1). Returns an unsubscribe fn. */
export function subscribeToBTCPrice(callback: (price: number) => void): () => void {
  let active = true;
  const tick = async () => {
    const { price } = await getBTCPriceUSD();
    if (active) callback(price);
  };
  void tick();
  const interval = setInterval(() => void tick(), 30_000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}
