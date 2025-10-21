import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret')
  const requiredSecret = process.env.ADMIN_SECRET

  if (!requiredSecret || auth !== requiredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [stripeAgg, printfulAgg] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { notIn: ['CANCELLED', 'REFUNDED'] }
      }
    }),
    prisma.order.aggregate({
      _sum: { printfulCost: true },
      where: { printfulCost: { not: null } }
    })
  ])

  const stripeTotal = toNumber(stripeAgg._sum.total)
  const printfulTotal = toNumber(printfulAgg._sum.printfulCost)
  const donationTotal = Number((stripeTotal - printfulTotal).toFixed(2))

  return NextResponse.json({
    totals: {
      stripe: stripeTotal,
      printful: printfulTotal,
      donation: donationTotal
    }
  })
}
