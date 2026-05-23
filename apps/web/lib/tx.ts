/**
 * Maps raw wallet/RPC errors to the plain-English copy specified in PRD §7.2
 * ("would a non-crypto CFO understand it?"). Never surfaces a hex revert blob.
 */
export function parseTxError(err: unknown): string {
  const msg = extractMessage(err).toLowerCase();

  if (msg.includes("user rejected") || msg.includes("user denied") || msg.includes("rejected the request")) {
    return "Transaction cancelled.";
  }
  if (msg.includes("insufficient funds") || msg.includes("exceeds balance") || msg.includes("transfer amount exceeds")) {
    return "You don't have enough tokens in your wallet.";
  }
  if (msg.includes("below min ratio")) {
    return "That would push your collateral ratio below the 150% floor.";
  }
  if (msg.includes("would breach min ratio")) {
    return "Withdrawing that much would breach the 150% floor.";
  }
  if (msg.includes("over-repay")) {
    return "That's more than you currently owe.";
  }
  if (msg.includes("stream underfunded")) {
    return "The vault doesn't hold enough MUSD to cover that.";
  }
  return "Transaction failed. Your funds were not moved. Try again.";
}

function extractMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    // viem stuffs the useful bits in shortMessage / details / cause.
    const e = err as Error & { shortMessage?: string; details?: string; cause?: unknown };
    return [e.shortMessage, e.message, e.details, extractMessage(e.cause)].filter(Boolean).join(" ");
  }
  if (typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}
