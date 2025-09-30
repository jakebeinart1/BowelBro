import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { lineItems, successUrl = '/success', cancelUrl = '/cart' } = await req.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems, // [{price_data:{currency:'usd',product_data:{name:'Tee'},unit_amount:2000},quantity:1}]
    success_url: `${process.env.NEXTAUTH_URL}${successUrl}`,
    cancel_url: `${process.env.NEXTAUTH_URL}${cancelUrl}`
  })

  return NextResponse.json({ id: session.id, url: session.url })
}
