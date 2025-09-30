import { NextRequest, NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

function originFromHeaders() {
  const h = headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? process.env.VERCEL_URL
  return `${proto}://${host}`
}

export async function POST(_req: NextRequest) {
  const cartId = cookies().get('cartId')?.value
  if (!cartId) return NextResponse.json({ error: 'No cart' }, { status: 400 })

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { variant: true } } }
  })
  if (!cart || !cart.items.length) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })

  const currency = process.env.STORE_CURRENCY || 'usd'
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency,
      product_data: { name: it.variant.name },
      unit_amount: Math.round(Number(it.variant.retailPrice) * 100)
    }
  }))

  const origin = process.env.NEXTAUTH_URL || originFromHeaders()
  const options: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items,
    success_url: `${origin}/success`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: { allowed_countries: ['US', 'CA'] },
    phone_number_collection: { enabled: true },
    metadata: { cartId }
  }

  if (process.env.STRIPE_SHIPPING_RATE_ID) {
    options.shipping_options = [{ shipping_rate: process.env.STRIPE_SHIPPING_RATE_ID }]
  }

  const session = await stripe.checkout.sessions.create(options)
  return NextResponse.json({ url: session.url })
}
