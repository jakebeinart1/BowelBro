import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import axios from 'axios'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const printful = axios.create({
  baseURL: 'https://api.printful.com',
  headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` }
})

export const runtime = 'nodejs'

type StripeCheckoutSession = Stripe.Checkout.Session

type PrintfulOrderRequest = {
  external_id: string
  recipient: {
    name?: string
    email?: string
    phone?: string
    address1?: string
    address2?: string
    city?: string
    state_code?: string
    country_code?: string
    zip?: string
  }
  items: Array<{
    sync_variant_id: number
    quantity: number
  }>
  confirm: boolean
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const buf = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook sig verify failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as StripeCheckoutSession

    const cartId = (session.metadata?.cartId ?? '') as string
    const currency = (session.currency ?? 'usd').toLowerCase()
    const total = Number(session.amount_total ?? 0) / 100

    let shippingAddress = session.shipping_details?.address
    const name = session.customer_details?.name ?? undefined
    const email = session.customer_details?.email ?? undefined
    const phone = session.customer_details?.phone ?? undefined

    if (!shippingAddress && session.payment_intent) {
      try {
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent.id

        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
          shippingAddress = paymentIntent.shipping?.address ?? undefined
        }
      } catch (err) {
        console.error('Failed to retrieve payment intent for fallback shipping address', err)
      }
    }

    if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.country || !shippingAddress?.postal_code) {
      console.error('Missing shipping address fields from Stripe; cannot create Printful order', {
        hasLine1: !!shippingAddress?.line1,
        hasCity: !!shippingAddress?.city,
        hasCountry: !!shippingAddress?.country,
        hasPostalCode: !!shippingAddress?.postal_code
      })
      return NextResponse.json({ received: true })
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { variant: true } } }
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.create({
      data: {
        status: 'PAID',
        total,
        currency,
        userId: null,
        shippingEmail: email,
        shippingPhone: phone,
        shippingName: name,
        shippingLine1: shippingAddress.line1,
        shippingLine2: shippingAddress.line2 ?? undefined,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state ?? undefined,
        shippingZip: shippingAddress.postal_code ?? undefined,
        shippingCountry: shippingAddress.country ?? undefined,
        items: {
          create: cart.items.map((it) => ({
            variantId: it.variant.id,
            quantity: it.quantity,
            unitPrice: Number(it.variant.retailPrice)
          }))
        }
      }
    })

    try {
      const items: PrintfulOrderRequest['items'] = cart.items.map((it) => ({
        sync_variant_id: Number(String(it.variant.printfulId)),
        quantity: it.quantity
      }))

      const payload: PrintfulOrderRequest = {
        external_id: order.id,
        recipient: {
          name,
          email,
          phone,
          address1: shippingAddress.line1,
          address2: shippingAddress.line2 ?? undefined,
          city: shippingAddress.city!,
          state_code: shippingAddress.state ?? undefined,
          country_code: shippingAddress.country!,
          zip: shippingAddress.postal_code!
        },
        items,
        confirm: true
      }

      await printful.post('/orders', payload)

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FULFILLING' }
      })
    } catch (error) {
      console.error('Printful order creation failed:', error)
    }

    await prisma.cart.delete({ where: { id: cart.id } }).catch(() => {})
  }

  return NextResponse.json({ received: true })
}
