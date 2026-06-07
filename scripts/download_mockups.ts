// scripts/download_mockups.ts
// Downloads mockup images from Printful sync data and catalog images
import 'dotenv/config'
import { prisma } from '../lib/db'
import axios, { AxiosError } from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Returns true if `filePath` is byte-identical to any other image already in `dir`.
function isDuplicateFile(filePath: string, dir: string): boolean {
  const target = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex')
  const base = path.basename(filePath)
  for (const other of fs.readdirSync(dir)) {
    if (other === base || !/\.(jpe?g|png)$/i.test(other)) continue
    const hash = crypto.createHash('md5').update(fs.readFileSync(path.join(dir, other))).digest('hex')
    if (hash === target) return true
  }
  return false
}

const MOCKUPS_DIR = path.join(process.cwd(), 'mockups')

const apiKey = (process.env.PRINTFUL_API_KEY ?? '').trim()
const storeId = (process.env.PRINTFUL_STORE_ID ?? '').trim()

const printful = axios.create({
  baseURL: 'https://api.printful.com',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    ...(storeId ? { 'X-PF-Store-Id': storeId } : {})
  }
})

async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60_000 })
    fs.writeFileSync(dest, Buffer.from(response.data))
    return true
  } catch (err) {
    console.warn(`  Failed to download: ${(err as Error).message}`)
    return false
  }
}

function clearDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return 0
  }
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f))
  for (const file of files) fs.unlinkSync(path.join(dir, file))
  return files.length
}

async function fetchSyncProductFiles(syncProductId: number) {
  try {
    const res = await printful.get(`/sync/products/${syncProductId}`)
    const result = res.data?.result
    return {
      product: result?.sync_product,
      variants: result?.sync_variants ?? []
    }
  } catch (err) {
    console.warn(`  Failed to fetch sync product ${syncProductId}: ${(err as AxiosError).message}`)
    return { product: null, variants: [] }
  }
}

async function main() {
  if (!apiKey) {
    console.error('PRINTFUL_API_KEY is not set')
    process.exit(1)
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isEnabled: true },
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!products.length) {
    console.log('No active products found. Run sync:printful first.')
    return
  }

  console.log(`Found ${products.length} active product(s).\n`)

  for (const product of products) {
    const productDir = path.join(MOCKUPS_DIR, product.name)
    const cleared = clearDirectory(productDir)
    if (cleared > 0) console.log(`Cleared ${cleared} old file(s) from "${product.name}"`)
    else console.log(`Created directory for "${product.name}"`)

    const syncProductId = Number(product.printfulId)
    console.log(`  Fetching files from Printful (sync product ${syncProductId})...`)

    const { variants: syncVariants } = await fetchSyncProductFiles(syncProductId)

    // Collect unique files across all variants
    const seenHashes = new Set<string>()
    let downloaded = 0

    for (const sv of syncVariants) {
      for (const file of (sv.files ?? [])) {
        const hash = file.hash ?? file.id?.toString() ?? file.preview_url
        if (seenHashes.has(hash)) continue
        seenHashes.add(hash)

        // Download mockup files (these show the design on the garment)
        if (file.type === 'mockup' && file.preview_url) {
          // Use original filename which contains view info (front, back, etc.)
          const originalName = file.filename ?? `mockup-${downloaded + 1}.jpg`
          // Preview is PNG but save with original name for view detection
          const fileName = originalName.replace(/\.jpg$/i, '.png')
          const filePath = path.join(productDir, fileName)

          const ok = await downloadFile(file.preview_url, filePath)
          if (ok) {
            downloaded++
            console.log(`  Downloaded: ${fileName}`)
          }
        }
      }

      // Note: we intentionally skip the variant catalog image (sv.product.image)
      // because it is a stock photo of a BLANK garment with no design printed on
      // it, which is confusing in the product gallery.
    }

    // Also download product thumbnail if available
    if (product.thumbnailUrl && !seenHashes.has('thumbnail')) {
      seenHashes.add('thumbnail')
      const ext = product.thumbnailUrl.includes('.png') ? '.png' : '.jpg'
      const fileName = `thumbnail-front${ext}`
      const filePath = path.join(productDir, fileName)
      const ok = await downloadFile(product.thumbnailUrl, filePath)
      if (ok) {
        // The thumbnail is often byte-identical to a mockup we already saved,
        // which would show the same image twice in the gallery. Drop it if so.
        if (isDuplicateFile(filePath, productDir)) {
          fs.unlinkSync(filePath)
        } else {
          downloaded++
          console.log(`  Downloaded: ${fileName} (product thumbnail)`)
        }
      }
    }

    const totalFiles = fs.readdirSync(productDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).length
    console.log(`  Total mockups for "${product.name}": ${totalFiles}\n`)
  }

  // Note stale directories
  const activeNames = new Set(products.map((p) => p.name))
  if (fs.existsSync(MOCKUPS_DIR)) {
    for (const dir of fs.readdirSync(MOCKUPS_DIR, { withFileTypes: true })) {
      if (dir.isDirectory() && !activeNames.has(dir.name)) {
        console.log(`Note: "${dir.name}" directory has no matching active product — consider removing`)
      }
    }
  }

  console.log('\nDone!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
  })
