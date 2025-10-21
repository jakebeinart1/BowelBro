import 'dotenv/config'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { prisma } from '@/lib/db'

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

async function main() {
  const year = parseArgYear(process.argv[2])

  const dateFilter = year
    ? {
        gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        lt: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))
      }
    : undefined

  const orders = await prisma.order.findMany({
    where: {
      printfulCost: { not: null },
      donationAmount: { not: null },
      ...(dateFilter ? { createdAt: dateFilter } : {})
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      stripeId: true,
      total: true,
      currency: true,
      printfulCost: true,
      donationAmount: true,
      printfulId: true
    }
  })

  const rows: string[] = []
  rows.push(
    [
      'Order ID',
      'Stripe Charge ID',
      'Printful Order ID',
      'Date (UTC)',
      'Stripe Total',
      'Printful Cost',
      'Donation Amount',
      'Currency'
    ].join(',')
  )

  let stripeTotal = 0
  let printfulTotal = 0
  let donationTotal = 0

  for (const order of orders) {
    const stripeAmount = toNumber(order.total)
    const printfulAmount = toNumber(order.printfulCost)
    const donationAmount = toNumber(order.donationAmount)

    stripeTotal += stripeAmount
    printfulTotal += printfulAmount
    donationTotal += donationAmount

    rows.push(
      [
        order.id,
        order.stripeId ?? '',
        order.printfulId?.toString() ?? '',
        order.createdAt.toISOString(),
        stripeAmount.toFixed(2),
        printfulAmount.toFixed(2),
        donationAmount.toFixed(2),
        order.currency
      ].join(',')
    )
  }

  rows.push('')
  rows.push(['Totals', '', '', '', stripeTotal.toFixed(2), printfulTotal.toFixed(2), donationTotal.toFixed(2), ''].join(','))

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
