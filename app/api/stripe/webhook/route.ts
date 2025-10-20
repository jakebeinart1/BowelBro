import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { AxiosError } from 'axios'
import type { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  CreatePrintfulOrderPayload,
  PrintfulOrder,
  createPrintfulOrder,
  getPrintfulOrderByExternalId
} from '@/lib/printful'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export const runtime = 'nodejs'

type StripeCheckoutSession = Stripe.Checkout.Session

function mapPrintfulStatus(status?: string | null): OrderStatus {
  const normalized = String(status ?? '').toLowerCase()

  if (!normalized) return 'FULFILLING'
  if (normalized.includes('cancel') || normalized.includes('fail')) return 'CANCELLED'
  if (normalized.includes('ship') || normalized.includes('fulfill')) return 'SHIPPED'
  if (normalized.includes('draft')) return 'PAID'

  return 'FULFILLING'
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
      const items: CreatePrintfulOrderPayload['items'] = cart.items.map((it) => ({
        sync_variant_id: Number(String(it.variant.printfulId)),
        quantity: it.quantity
      }))

      const payload: CreatePrintfulOrderPayload = {
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

      const printfulOrder = await createPrintfulOrder(payload)

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: mapPrintfulStatus(printfulOrder?.status),
          printfulId: printfulOrder?.id ?? undefined
        }
      })
    } catch (error) {
      const axiosError = error as AxiosError<{ result?: PrintfulOrder | null }>
      let handled = false

      if (axiosError?.response?.status === 409 || axiosError?.response?.status === 400) {
        const existing = await getPrintfulOrderByExternalId(order.id).catch(() => null)

        if (existing) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: mapPrintfulStatus(existing.status),
              printfulId: existing.id ?? undefined
            }
          })

          handled = true
        }
      }

      if (!handled) {
        console.error('Printful order creation failed:', axiosError?.response?.data ?? error)
      }
    }

    await prisma.cart.delete({ where: { id: cart.id } }).catch(() => {})
  }

  return NextResponse.json({ received: true })
}
