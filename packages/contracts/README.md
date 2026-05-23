# @croesus/contracts

Solidity contracts for Croesus — the non-custodial Bitcoin treasury operating system.
See the [root README](../../README.md) for the full project overview.

## Contracts

| Contract | Purpose |
|---|---|
| `CroesusRegistry` | Org factory and registry. Deploys and tracks per-org Vault and Stream contracts and wires them to the Mezo + Pyth dependencies. |
| `CroesusVault` | Collateral and borrowing. Deposit tBTC, borrow MUSD, repay, withdraw. `fundStream` transfers already-borrowed MUSD (it never mints). |
| `CroesusStream` | Per-second MUSD payroll streaming with pause, resume, cancel, and claim. |
| `src/mocks/*` | `MockMUSD`, `MockTBTC`, `MockMezoBorrow`, `MockPyth` — a local stand-in for the Mezo stack so the system runs end-to-end before the live integration is wired. |

## Invariants

- Collateral ratio is scaled so that `1e18 == 100%`.
- Croesus margin-call ratio is `1.5e18` (150%); Mezo liquidation ratio is `1.1e18` (110%).
- `getMarginCallPrice()` is always strictly above `getLiquidationPrice()` — the two are
  never conflated.
- `SECONDS_PER_MONTH = 2_628_000`, identical to the frontend.

## Usage

```bash
# Build
forge build

# Test
forge test -vvv

# Coverage
forge coverage

# Gas snapshot
forge snapshot

# Format
forge fmt
```

## Local deployment

Start a local node, then deploy the mock stack and the registry:

```bash
anvil

# In a second terminal
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

The deploy is deterministic from Anvil's first account, so the resulting addresses match
the defaults in the repo's `.env.example`. After deploying, export ABIs for the frontend:

```bash
pnpm --filter @croesus/contracts abi:export
```

## Layout

```
src/        CroesusRegistry, CroesusVault, CroesusStream, mocks/
test/       Foundry test suites (Croesus*.t.sol)
script/     Deploy.s.sol
```

Powered by [Foundry](https://getfoundry.sh) and [OpenZeppelin](https://openzeppelin.com).
Documentation: <https://book.getfoundry.sh/>.
