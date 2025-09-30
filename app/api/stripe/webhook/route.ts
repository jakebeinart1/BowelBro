import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const buf = await req.arrayBuffer()
  const text = Buffer.from(buf).toString('utf8')
  let event

  try {
    event = stripe.webhooks.constructEvent(text, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook error', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: mark order as paid, create Printful order if desired
      break
  }

  return NextResponse.json({ received: true })
}
