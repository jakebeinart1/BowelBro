// scripts/sync_printful.ts
import 'dotenv/config'
import { prisma } from '../lib/db'
import { syncPrintfulProducts } from '../lib/sync-printful'

async function main() {
  const result = await syncPrintfulProducts()
  console.log(`Sync complete. Products processed: ${result.processed}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
  })
