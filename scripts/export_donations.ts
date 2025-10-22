import 'dotenv/config'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { printful } from '@/lib/printful'

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'FULFILLING'
  | 'SHIPPED'
  | 'CANCELLED'
  | 'REFUNDED'
  | string

type SerializableOrder = {
  id: string
  stripeId: string | null
  printfulId: number | null
  createdAt: Date
  total: number
  currency: string
  printfulCost: number | null
  donationAmount: number | null
  status: OrderStatus
  printfulResponse: any
}

type StripeInfo = {
  amountPaid: number | null
  amountRefunded: number
  currency: string | null
  status?: string | null
}

function parseArgYear(value?: string): number | null {
  if (!value) return null
  const numeric = Number(value)
  if (!Number.isInteger(numeric) || numeric < 2000) return null
  return numeric
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseAmount(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return Number(value.toFixed(2))
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Number(parsed.toFixed(2))
  }
  return null
}

function extractCostFromResponse(response: any): number | null {
  if (!response || typeof response !== 'object') return null

  const candidates = [
    response?.costs?.total,
    response?.result?.costs?.total,
    response?.order?.costs?.total
  ]

  for (const candidate of candidates) {
    const amount = parseAmount(candidate)
    if (amount !== null) return amount
  }

  return null
}

function extractPrintfulId(response: any): number | null {
  if (!response || typeof response !== 'object') return null
  const candidates = [response?.id, response?.result?.id, response?.order?.id]
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string') {
      const parsed = Number(candidate)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function computeDonation(stripeAmount: number, printfulCost: number | null): number | null {
  if (printfulCost === null) return null
  const donation = stripeAmount - printfulCost
  return Number.isFinite(donation) ? Number(donation.toFixed(2)) : null
}

const remoteOrderCache = new Map<string, { cost: number | null; orderId?: number | null }>()
const stripeCache = new Map<string, StripeInfo>()

async function fetchPrintfulCost(identifier: string): Promise<{ cost: number | null; orderId?: number | null }> {
  if (remoteOrderCache.has(identifier)) {
    return remoteOrderCache.get(identifier) as { cost: number | null; orderId?: number | null }
  }

  try {
    const res = await printful.get(`/v2/orders/${identifier}`)
    const body = res.data
    const cost = extractCostFromResponse(body)
    const resolvedId = extractPrintfulId(body)
    const result = { cost, orderId: resolvedId }
    remoteOrderCache.set(identifier, result)
    return result
  } catch (error) {
    console.warn(`[donations] Failed to fetch Printful order ${identifier}:`, (error as any)?.message ?? error)
    const fallback = { cost: null as number | null }
    remoteOrderCache.set(identifier, fallback)
    return fallback
  }
}

const stripeSecret = process.env.STRIPE_SECRET_KEY

const stripeClient = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  : null

async function fetchStripeInfo(stripeId: string | null): Promise<StripeInfo> {
  if (!stripeId || !stripeClient) return { amountPaid: null, amountRefunded: 0, currency: null }

  if (stripeCache.has(stripeId)) return stripeCache.get(stripeId) as StripeInfo

  try {
    const intent = await stripeClient.paymentIntents.retrieve(stripeId, { expand: ['charges.data'] })
    const amountReceived = intent.amount_received ?? intent.amount ?? 0
    const amountRefundedFromIntent = (intent as Stripe.PaymentIntent & { amount_refunded?: number }).amount_refunded ?? 0
    const charges = (intent as Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> }).charges
    const chargeRefunds = charges?.data?.reduce((sum, charge) => sum + (charge.amount_refunded ?? 0), 0) ?? 0
    const refundTotal = Math.max(amountRefundedFromIntent, chargeRefunds)
    const info: StripeInfo = {
      amountPaid: Number((amountReceived / 100).toFixed(2)),
      amountRefunded: Number((refundTotal / 100).toFixed(2)) ?? 0,
      currency: intent.currency ? intent.currency.toUpperCase() : null,
      status: intent.status ?? null
    }
    stripeCache.set(stripeId, info)
    return info
  } catch (error) {
    console.warn(`[donations] Failed to fetch Stripe payment ${stripeId}:`, (error as any)?.message ?? error)
    const fallback: StripeInfo = { amountPaid: null, amountRefunded: 0, currency: null }
    stripeCache.set(stripeId, fallback)
    return fallback
  }
}

async function main() {
  const year = parseArgYear(process.argv[2])

  const dateFilter = year
    ? {
        gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        lt: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))
      }
    : undefined

  const orders = (await prisma.order.findMany({
    where: dateFilter ? { createdAt: dateFilter } : undefined,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      stripeId: true,
      total: true,
      currency: true,
      printfulCost: true,
      donationAmount: true,
      printfulId: true,
      status: true,
      printfulResponse: true
    }
  })) as SerializableOrder[]

  const rows: string[] = []
  rows.push(
    [
      'Order ID',
      'Stripe Charge ID',
      'Printful Order ID',
      'Status',
      'Date (UTC)',
      'Stripe Amount Paid',
      'Stripe Amount Refunded',
      'Printful Amount Paid',
      'Donation Amount',
      'Refunded',
      'Currency'
    ].join(',')
  )

  let stripeCollected = 0
  let stripeRefundedTotal = 0
  let printfulSpent = 0
  let donationTotal = 0

  for (const order of orders) {
    const stripeAmount = Number(toNumber(order.total).toFixed(2))
    let derivedCost = parseAmount(order.printfulCost) ?? extractCostFromResponse(order.printfulResponse)
    let printfulOrderId = order.printfulId ?? extractPrintfulId(order.printfulResponse)

    if (derivedCost === null) {
      const identifier = printfulOrderId ? String(printfulOrderId) : `@${order.id}`
      const remote = await fetchPrintfulCost(identifier)
      derivedCost = remote.cost
      if (!printfulOrderId && remote.orderId) {
        printfulOrderId = remote.orderId
      }
    }

    const stripeInfo = await fetchStripeInfo(order.stripeId)
    const stripePaid = stripeInfo.amountPaid ?? stripeAmount
    const stripeRefunded = stripeInfo.amountRefunded ?? 0
    const netStripe = Number(Math.max(stripePaid - stripeRefunded, 0).toFixed(2))

    const donationAmount =
      parseAmount(order.donationAmount) ?? computeDonation(netStripe, derivedCost)

    const normalizedStatus = typeof order.status === 'string' ? order.status.toUpperCase() : 'UNKNOWN'
    const isRefunded = normalizedStatus === 'REFUNDED' || stripeRefunded > 0
    const isCancelled = normalizedStatus === 'CANCELLED'
    const isFinalized = !isRefunded && !isCancelled

    if (isFinalized) {
      stripeCollected += netStripe
      stripeRefundedTotal += stripeRefunded
      if (derivedCost !== null) printfulSpent += derivedCost
      if (donationAmount !== null) donationTotal += donationAmount
    }

    rows.push(
      [
        order.id,
        order.stripeId ?? '',
        printfulOrderId?.toString() ?? '',
        order.status,
        order.createdAt.toISOString(),
        stripePaid.toFixed(2),
        stripeRefunded.toFixed(2),
        derivedCost !== null ? derivedCost.toFixed(2) : '',
        donationAmount !== null ? donationAmount.toFixed(2) : '',
        isRefunded ? 'Yes' : isCancelled ? 'Cancelled' : 'No',
        stripeInfo.currency ?? order.currency
      ].join(',')
    )
  }

  rows.push('')
  rows.push(
    [
      'Totals (Finalized Orders Only)',
      '',
      '',
      '',
      '',
      stripeCollected.toFixed(2),
      stripeRefundedTotal.toFixed(2),
      printfulSpent.toFixed(2),
      donationTotal.toFixed(2),
      '',
      ''
    ].join(',')
  )

  const reportDir = path.join(process.cwd(), 'reports')
  await mkdir(reportDir, { recursive: true })

  const filename = year ? `donations-${year}.csv` : 'donations-all.csv'
  const outputPath = path.join(reportDir, filename)

  await writeFile(outputPath, rows.join('\n'), 'utf8')

  console.log(`Donation report written to ${outputPath}`)
}

main()
  .catch((error) => {
    console.error('Failed to export donation report', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
