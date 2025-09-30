import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createCheckoutSession } from '@/lib/checkout'
import { getRequestOrigin } from '@/lib/origin'

export async function POST(_req: NextRequest) {
  const cartId = cookies().get('cartId')?.value
  if (!cartId) return NextResponse.json({ error: 'No cart' }, { status: 400 })

  try {
    const origin = process.env.NEXTAUTH_URL || getRequestOrigin()
    const session = await createCheckoutSession({ cartId, origin })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
