import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Printful sends event data; optionally verify with shared secret if you set one.
  const signature = req.headers.get('x-printful-signature')
  const body = await req.json().catch(() => null)

  // TODO: validate signature if using a shared secret.
  console.log('Printful webhook event:', { signature, body })

  // Handle events like order.created, order.updated, package.shipped, etc.
  // Update your DB accordingly.

  return NextResponse.json({ received: true })
}
