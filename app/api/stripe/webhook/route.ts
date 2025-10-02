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
    const email = session.customer_details?.email ?? undefined
    const phone = session.customer_details?.phone ?? undefined
    const name = session.customer_details?.name ?? undefined
    const addr = session.shipping_details?.address
    const currency = (session.currency ?? 'usd').toLowerCase()
    const total = Number(session.amount_total ?? 0) / 100

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
        shippingLine1: addr?.line1,
        shippingLine2: addr?.line2 ?? undefined,
        shippingCity: addr?.city,
        shippingState: addr?.state ?? undefined,
        shippingZip: addr?.postal_code ?? undefined,
        shippingCountry: addr?.country ?? undefined,
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
          name: name ?? undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
          address1: addr?.line1 ?? undefined,
          address2: addr?.line2 ?? undefined,
          city: addr?.city ?? undefined,
          state_code: addr?.state ?? undefined,
          country_code: addr?.country ?? undefined,
          zip: addr?.postal_code ?? undefined
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
