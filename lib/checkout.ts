import type Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

type CreateCheckoutSessionArgs = {
  cartId: string
  origin: string
}

export async function createCheckoutSession({ cartId, origin }: CreateCheckoutSessionArgs) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { variant: true }
      }
    }
  })

  if (!cart || cart.items.length === 0) throw new Error('Cart is empty')

  const currency = process.env.STORE_CURRENCY || 'usd'
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((item) => {
    const unitAmount = Math.round(Number(item.variant.retailPrice ?? 0) * 100)
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error(`Variant ${item.variant.id} has an invalid price`)
    }

    return {
      quantity: item.quantity,
      price_data: {
        currency,
        product_data: { name: item.variant.name },
        unit_amount: unitAmount
      }
    }
  })

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items,
    success_url: `${origin}/success`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: { allowed_countries: ['US', 'CA'] },
    phone_number_collection: { enabled: true },
    metadata: { cartId }
  }

  if (process.env.STRIPE_SHIPPING_RATE_ID) {
    params.shipping_options = [{ shipping_rate: process.env.STRIPE_SHIPPING_RATE_ID }]
  }

  return stripe.checkout.sessions.create(params)
}
