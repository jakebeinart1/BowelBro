// app/api/printful/products/route.ts
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// Deeply convert BigInt -> string so JSON.stringify won't explode
function bigIntToString(value: any): any {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Prisma.Decimal) return value.toString()
  if (Array.isArray(value)) return value.map(bigIntToString)
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) out[k] = bigIntToString(v)
    return out
  }
  return value
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isEnabled: true },
        include: { mockups: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  const safe = bigIntToString(products)
  return NextResponse.json({ products: safe })
}
