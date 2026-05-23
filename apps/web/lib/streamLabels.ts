import type { Address } from "viem";

/**
 * Stream labels are display-only and live off-chain in localStorage (PRD §7.3 / §10.1),
 * keyed by stream-contract address + stream id so they don't collide across orgs.
 */
const KEY = "croesus.streamLabels";

type LabelMap = Record<string, string>;

function entryKey(streamAddress: Address, id: bigint): string {
  return `${streamAddress.toLowerCase()}:${id.toString()}`;
}

function read(): LabelMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as LabelMap;
  } catch {
    return {};
  }
}

export function getStreamLabel(streamAddress: Address, id: bigint): string | undefined {
  return read()[entryKey(streamAddress, id)];
}

export function setStreamLabel(streamAddress: Address, id: bigint, label: string): void {
  if (typeof window === "undefined") return;
  const map = read();
  const k = entryKey(streamAddress, id);
  if (label.trim()) map[k] = label.trim();
  else delete map[k];
  window.localStorage.setItem(KEY, JSON.stringify(map));
}
