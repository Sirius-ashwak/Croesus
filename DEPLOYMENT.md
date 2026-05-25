# Deploying Croesus

Croesus is a **Turborepo + pnpm monorepo**. Only the Next.js 14 app at
`apps/web` (`@croesus/web`) is deployed — the Foundry/Solidity package at
`packages/contracts` is **never** built (no toolchain on the host, and the
build is scoped away from it with `pnpm --filter`).

Two paths are provided: **Render** (recommended — see below) and **Vercel**.

---

## Deploy to Render (recommended)

The root [`render.yaml`](./render.yaml) Blueprint deploys `apps/web` as a Node
**web service**. Everything runs from the repo root and targets the workspace
with `pnpm --filter`, so there is **no "Root Directory" setting to misconfigure**.

| Setting | Value |
| --- | --- |
| Build Command | `corepack enable && pnpm install && pnpm --filter @croesus/web env:mezo && pnpm --filter @croesus/web build` |
| Start Command | `pnpm --filter @croesus/web exec next start -p $PORT` |
| Runtime / Node | Node `20.18.0` (`NODE_VERSION`) |
| Health check | `/` |

**Steps:**

1. Commit and push `render.yaml` to `main`.
2. In Render → **New → Blueprint** → connect `github.com/Sirius-ashwak/Croesus`.
3. Render reads `render.yaml`, creates the `croesus` web service. Click **Apply**.
4. (Optional) Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in the service's
   Environment tab for mobile/QR wallets, then redeploy.

Notes:
- The build bakes the public **Mezo-testnet** config from `apps/web/.env.mezo`
  via `env:mezo` (same as the env table in [§ Environment variables](#environment-variables)).
- **Free plan spins down when idle** (~50 s cold start). Use the `starter` plan
  in `render.yaml` for always-on.
- All routes are static, so a Render **Static Site** (always-on free) also works
  if you add `output: "export"` to `next.config.mjs` and publish `apps/web/out`.

---

## Deploy to Vercel (alternative)

> ⚠️ On Vercel, set **Root Directory = `apps/web`** (its `package.json` has
> `next`, required for framework detection) and ensure `vercel.json`'s
> `outputDirectory` is **`.next`** (resolved relative to the root directory).

Only the Next.js 14 app at `apps/web` (`@croesus/web`) is deployed to Vercel —
the Foundry/Solidity package at `packages/contracts` is **never** built on Vercel
(no toolchain there, and the build is scoped away from it).

The root [`vercel.json`](./vercel.json) handles this:

| Setting | Value | Why |
| --- | --- | --- |
| `framework` | `nextjs` | Enables Next.js runtime features (SSR, image opt). |
| `buildCommand` | `pnpm --filter @croesus/web env:mezo && pnpm exec turbo run build --filter=@croesus/web` | Bakes the Mezo-testnet env, then builds **only** the web app — contracts are filtered out. |
| `outputDirectory` | `apps/web/.next` | Where Next emits the build. |

The install step is left to Vercel's auto-detection: it sees `pnpm-lock.yaml`
at the repo root and installs the whole workspace with pnpm.

---

## 1. Deploy from the Vercel dashboard (recommended)

1. Push this repo to GitHub (it's already at
   `github.com/Sirius-ashwak/Croesus`).
2. In Vercel → **Add New… → Project → Import** the repo.
3. **Leave the Root Directory as the repo root (`./`).** The root `vercel.json`
   already points the build at `apps/web`. Do **not** set Root Directory to
   `apps/web` — that would make Vercel ignore this `vercel.json`.
4. Framework / Build / Output are read from `vercel.json` — no overrides needed.
5. (Optional) Add env vars — see [§3](#3-environment-variables).
6. **Deploy.**

## 2. Deploy from the CLI

```bash
npm i -g vercel        # if not installed
vercel login
vercel                 # preview deploy (run from repo root)
vercel --prod          # production deploy
```

`.vercelignore` keeps contracts/docs/build artifacts out of the upload.

---

## 3. Environment variables

The build auto-runs `pnpm env:mezo`, which copies the committed
[`apps/web/.env.mezo`](./apps/web/.env.mezo) (public **Mezo testnet** addresses,
no secrets) into `.env.local`. So a default import deploys against live testnet
with **zero dashboard config**.

To override any value, set it in **Vercel → Project → Settings → Environment
Variables**. Next.js checks `process.env` **before** `.env.local`, so dashboard
values always win over the baked defaults. All client vars must keep the
`NEXT_PUBLIC_` prefix and are inlined at **build time** (re-deploy after a change).

| Variable | Baked default (testnet) | Set in dashboard when… |
| --- | --- | --- |
| `NEXT_PUBLIC_CHAIN_ID` | `31611` (matsnet) | Targeting Mezo mainnet → `39`. |
| `NEXT_PUBLIC_MEZO_RPC` | `https://rpc.test.mezo.org` | Using a different RPC. |
| `NEXT_PUBLIC_MEZO_EXPLORER` | `https://explorer.test.mezo.org` | Mainnet explorer. |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | `0x29c2…5d55` | Re-deployed contracts. |
| `NEXT_PUBLIC_PYTH_ORACLE_ADDRESS` | `0xe9eB…7cBf` | Re-deployed / mainnet. |
| `NEXT_PUBLIC_MUSD_TOKEN_ADDRESS` | `0x1189…c503` | Mainnet MUSD. |
| `NEXT_PUBLIC_TBTC_TOKEN_ADDRESS` | `0x517f…0161` | Mainnet collateral. |
| `NEXT_PUBLIC_BTC_USD_PRICE_FEED_ID` | Pyth BTC/USD feed | (rarely changes) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | _blank_ | **Recommended** — see below. |
| `NEXT_PUBLIC_DEMO_BTC_PRICE_USD` | _blank_ (reads on-chain) | Forcing a demo price. |
| `NEXT_PUBLIC_DEMO_ORG_ADDRESS` | _blank_ | Presenter fallback org. |

### WalletConnect
Without `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, RainbowKit falls back to
injected (browser-extension) wallets only — the app still works. For
mobile/QR wallet support, grab a free project ID at
[cloud.walletconnect.com](https://cloud.walletconnect.com) and set it in the
dashboard.

---

## 4. Switching to Mezo mainnet (chainId 39)

Production targets mainnet, but contract addresses for mainnet are still
**Open Questions** (OQ-01..05). When resolved, either update
`apps/web/.env.mezo` or override the table above in the Vercel dashboard, then
re-deploy.
