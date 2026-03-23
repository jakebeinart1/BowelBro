# Bowel Bro Store

Next.js 14 + Printful + Stripe e-commerce store for IBD charity merchandise. 100% of profits fund IBD research and patient support.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL (Neon) via Prisma ORM
- **Payments**: Stripe (checkout sessions + webhooks)
- **Fulfillment**: Printful (print-on-demand, auto-order via webhooks)
- **Auth**: NextAuth v5 (beta) with Google OAuth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (auto-deploys on push to `main`)

## Key Scripts

```bash
npm run dev              # Local dev server
npm run build            # Production build
npm run sync:printful    # Sync products/variants from Printful API to DB
npm run download:mockups # Download fresh mockup images from Printful
npm run db:push          # Push Prisma schema to database
npm run db:studio        # Open Prisma Studio GUI
npm run report:donations # Export donation report CSV
```

## Mockup Refresh Workflow

When garments are updated on Printful:

1. `npm run sync:printful` — updates product/variant data + file URLs in DB
2. `npm run download:mockups` — downloads fresh mockup images to `/mockups/`
3. For additional mockup angles, generate them via the Printful dashboard and place them in `/mockups/{PRODUCT NAME}/`

Mockup images are served from `/mockups/{PRODUCT NAME}/` directories. The system auto-detects view types (front, back, left, right, lifestyle) from filenames. Supports JPG and PNG formats.

## Project Structure

```
app/
  products/           # Product listing and detail pages
  api/
    printful/         # Printful sync, webhook, products API
    stripe/           # Stripe webhook handler
    checkout/         # Checkout session creation
    admin/            # Admin sync endpoint
  mockups/[product]/[image]/  # Mockup image serving route
lib/
  printful.ts         # Printful API client (v1 + v2)
  sync-printful.ts    # Product sync orchestration
  mockup-images.ts    # Local mockup file management + view detection
  stripe.ts           # Stripe client
  cart.ts             # Cart management (cookie-based)
  pricing.ts          # Price markup calculation (+$5 base, +8% tax, +3% Stripe)
  db.ts               # Prisma client singleton
  retry.ts            # Exponential backoff retry utility
scripts/
  sync_printful.ts    # CLI sync script
  download_mockups.ts # CLI mockup download script
  export_donations.ts # Donation report CSV export
mockups/              # Local mockup images by product name
prisma/
  schema.prisma       # Database schema
```

## Environment Variables

**Required for all environments:**
- `DATABASE_URL` — PostgreSQL connection string (Neon)
- `PRINTFUL_API_KEY` — Printful store API token
- `PRINTFUL_STORE_ID` — Printful store ID
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `NEXTAUTH_SECRET` — Session encryption secret
- `NEXTAUTH_URL` — Base URL for auth callbacks
- `ADMIN_SECRET` — Admin endpoint protection
- `NEXT_PUBLIC_BASE_URL` — Public site URL

## Order Flow

1. Customer adds variant to cart (cookie-based cart)
2. Checkout creates Stripe session with shipping collection (US/CA)
3. `checkout.session.completed` webhook creates Order + submits to Printful
4. Printful webhook updates order status (FULFILLING -> SHIPPED)
5. Donation = Stripe revenue - Printful cost

## Database

Uses BigInt for Printful IDs. Key models: Product, Variant, VariantMockup, Cart, CartItem, Order, OrderItem. Run `npx prisma db push` after schema changes.
