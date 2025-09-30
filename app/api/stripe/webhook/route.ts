import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { createPrintfulOrder } from '@/lib/printful'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const buf = Buffer.from(await req.arrayBuffer())
  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature error', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const cartId = session.metadata?.cartId

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { variant: { include: { product: true } } } } }
    })
    if (!cart || !cart.items.length) return NextResponse.json({ ok: true })

    const amountTotal = Number(session.amount_total ?? 0) / 100
    const currency = session.currency ?? 'usd'
    const email = session.customer_details?.email ?? null
    const phone = session.customer_details?.phone ?? null
    const name = session.customer_details?.name ?? null
    const addr = session.shipping_details?.address

    const order = await prisma.order.create({
      data: {
        status: 'PAID',
        total: amountTotal,
        currency,
        userId: null,
        shippingEmail: email ?? undefined,
        shippingPhone: phone ?? undefined,
        shippingName: name ?? undefined,
        shippingLine1: addr?.line1 ?? undefined,
        shippingLine2: addr?.line2 ?? undefined,
        shippingCity: addr?.city ?? undefined,
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

    const items = cart.items.map((it) => ({
      sync_variant_id: Number(String(it.variant.printfulId)),
      quantity: it.quantity
    }))

    try {
      await createPrintfulOrder({
        external_id: order.id,
        recipient: {
          name: name ?? undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
          address1: addr?.line1,
          address2: addr?.line2,
          city: addr?.city,
          state_code: addr?.state,
          country_code: addr?.country,
          zip: addr?.postal_code
        },
        items,
        confirm: true
      })
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FULFILLING' } })
    } catch (e) {
      console.error('Printful order create failed', e)
    }

    await prisma.cart.delete({ where: { id: cart.id } }).catch(() => {})
  }

  return NextResponse.json({ received: true })
}
