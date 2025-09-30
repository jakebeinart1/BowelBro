# Printful Store Starter (Next.js + Stripe + Prisma)

A production-ready foundation to sell T‑shirts via Printful. Features:
- Next.js App Router, TypeScript, Tailwind
- Stripe Checkout
- Prisma + Postgres (Neon/PlanetScale/etc.)
- Printful product sync & order webhooks
- NextAuth for user sessions + admin role
- Minimal product/catalog UI

## Quick Start

1) Clone & install
```bash
pnpm i # or npm i / yarn
cp .env.example .env.local
```
2) Set environment variables in `.env.local` (Printful, Stripe, DB).  
3) Push DB & generate client
```bash
pnpm db:push
```
4) Run dev
```bash
pnpm dev
```

## Syncing Products from Printful
- Add your `PRINTFUL_API_KEY` and `PRINTFUL_STORE_ID`.
- Run: `pnpm sync:printful`

## Webhooks
- Stripe: set to `/api/stripe/webhook`
- Printful: set to `/api/printful/webhook`

## Notes
- Prices are sourced from Printful variant retail price; override UI to add your margin strategy if needed.
- Orders are created after Stripe success; Printful order creation can be immediate or deferred depending on your flow.
