import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { AxiosError } from 'axios'
import { Prisma, type OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  CreatePrintfulOrderPayload,
  PrintfulOrder,
  createPrintfulOrder,
  getPrintfulOrderByExternalId
} from '@/lib/printful'
import { retry } from '@/lib/retry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export const runtime = 'nodejs'

type StripeCheckoutSession = Stripe.Checkout.Session


function jsonField(value: Prisma.InputJsonValue | null): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === null ? Prisma.JsonNull : value
}

function mapPrintfulStatus(status?: string | null): OrderStatus {
  const normalized = String(status ?? '').toLowerCase()

  if (!normalized) return 'FULFILLING'
  if (normalized.includes('cancel') || normalized.includes('fail')) return 'CANCELLED'
  if (normalized.includes('ship') || normalized.includes('in_transit')) return 'SHIPPED'
  if (normalized.includes('queue') || normalized.includes('production') || normalized.includes('fulfill')) return 'FULFILLING'
  if (normalized.includes('draft') || normalized.includes('pending')) return 'PAID'

  return 'FULFILLING'
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (!error) return false

  if (error instanceof Prisma.PrismaClientInitializationError) return true

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001') return true

  if (typeof (error as any)?.code === 'string' && (error as any).code === 'P1001') return true

  return false
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
    try {
      const session = event.data.object as StripeCheckoutSession

      const cartId = (session.metadata?.cartId ?? '') as string
      if (!cartId) {
        console.warn('Stripe session missing cartId metadata; skipping fulfillment', {
          stripeId: stripeIdentifier
        })
        return NextResponse.json({ received: true })
      }
      const currency = (session.currency ?? 'usd').toLowerCase()
      const total = Number(session.amount_total ?? 0) / 100
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null
      const stripeIdentifier = paymentIntentId ?? session.id

      if (session.payment_status && session.payment_status !== 'paid') {
        console.info('Skipping non-paid checkout.session.completed event', {
          stripeId: stripeIdentifier,
          paymentStatus: session.payment_status
        })
        return NextResponse.json({ received: true })
      }

      const existingOrder = await prisma.order.findUnique({ where: { stripeId: stripeIdentifier } })
      if (existingOrder) {
        console.info('Order already processed for Stripe identifier, skipping duplicate fulfillment', {
          stripeId: stripeIdentifier,
          orderId: existingOrder.id
        })
        return NextResponse.json({ received: true })
      }

      let shippingAddress = session.shipping_details?.address
      const name = session.customer_details?.name ?? undefined
      const email = session.customer_details?.email ?? undefined
      const phone = session.customer_details?.phone ?? undefined

      if (!shippingAddress && paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
          shippingAddress = paymentIntent.shipping?.address ?? undefined
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

      const cart = await retry(
        () =>
          prisma.cart.findUnique({
            where: { id: cartId },
            include: { items: { include: { variant: true } } }
          }),
        3,
        400
      )

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ received: true })
      }

      const order = await prisma.order.create({
        data: {
          status: 'PAID',
          total,
          currency,
          stripeId: stripeIdentifier,
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
        const items: CreatePrintfulOrderPayload['items'] = cart.items.map((it) => {
          const variant = it.variant
          const syncVariantId = Number(variant.printfulId)

          if (!Number.isFinite(syncVariantId) || syncVariantId <= 0) {
            throw new Error(`Missing Printful sync variant id for variant ${variant.id}; re-run sync to refresh catalog mappings.`)
          }

          return {
            sync_variant_id: syncVariantId,
            quantity: it.quantity
          }
        })

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
          confirm: false
        }

        const payloadForStorage = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue

        await prisma.order.update({
          where: { id: order.id },
          data: {
            printfulPayload: payloadForStorage,
            printfulError: null
          }
        })

        const printfulOrder = await createPrintfulOrder(payload)

        if (printfulOrder) {
          const responseForStorage = JSON.parse(JSON.stringify(printfulOrder)) as Prisma.InputJsonValue
          const now = new Date()

          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: mapPrintfulStatus(printfulOrder.status),
              printfulId: printfulOrder.id ?? undefined,
              printfulResponse: jsonField(responseForStorage),
              printfulSyncedAt: now,
              printfulError: null,
              printfulCost: null,
              donationAmount: null
            }
          })
        } else {
          console.warn('Printful manual order submission returned no order payload', {
            externalId: order.id
          })
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ result?: PrintfulOrder | null }>
        let handled = false

        if (axiosError?.response?.status === 409 || axiosError?.response?.status === 400) {
          const existing = await getPrintfulOrderByExternalId(order.id).catch(() => null)

          if (existing) {
            const responseForStorage = JSON.parse(JSON.stringify(existing)) as Prisma.InputJsonValue
            const now = new Date()

            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: mapPrintfulStatus(existing.status),
                printfulId: existing.id ?? undefined,
                printfulResponse: jsonField(responseForStorage),
                printfulSyncedAt: now,
                printfulError: null,
                printfulCost: null,
                donationAmount: null
              }
            })

            handled = true
          }
        }

        if (!handled) {
          const responseData = axiosError?.response?.data ?? null
          const responseForStorage = responseData ? (JSON.parse(JSON.stringify(responseData)) as Prisma.InputJsonValue) : null
          const errorMessage = axiosError?.message ?? (typeof error === 'string' ? error : 'Unknown Printful error')

          await prisma.order.update({
            where: { id: order.id },
            data: {
              printfulResponse: jsonField(responseForStorage),
              printfulError: errorMessage,
              printfulSyncedAt: new Date(),
              printfulCost: null,
              donationAmount: null
            }
          }).catch(() => {})

          console.error('Printful order creation failed:', responseData ?? error)
          throw error
        }
      }

      await prisma.cart.delete({ where: { id: cart.id } }).catch(() => {})
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        console.error('Stripe webhook failed: database unreachable', error)
        return NextResponse.json({ error: 'database_unreachable' }, { status: 503 })
      }

      console.error('Stripe webhook failed unexpectedly', error)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
