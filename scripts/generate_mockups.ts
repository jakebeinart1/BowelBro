// scripts/generate_mockups.ts
// Generates 5 mockup views per product using Printful Mockup Generator API
import 'dotenv/config'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60_000 })
    fs.writeFileSync(dest, Buffer.from(response.data))
    return true
  } catch (err) {
    console.warn(`  ✗ Failed to download ${path.basename(dest)}: ${(err as Error).message}`)
    return false
  }
}

async function getSyncProductDetails(syncProductId: number) {
  const res = await printful.get(`/sync/products/${syncProductId}`)
  return res.data?.result as {
    sync_product: { id: number; name: string; thumbnail_url?: string }
    sync_variants: Array<{
      id: number
      name: string
      product: { variant_id: number; product_id: number }
      files: Array<{ id: number; type: string; preview_url?: string; thumbnail_url?: string }>
    }>
  }
}

async function getFrontTemplate(catalogProductId: number) {
  const res = await printful.get(`/mockup-generator/templates/${catalogProductId}`)
  const templates: Array<{
    template_id: number
    image_url: string
    printfile_id: number
    print_area_width: number
    print_area_height: number
  }> = res.data?.result?.templates ?? []
  // Find front ghost template (not zoomed)
  return templates.find((t) => {
    const url = t.image_url ?? ''
    return url.includes('/front/') && !url.includes('zoomed')
  }) ?? templates[0]
}

async function createMockupTask(
  catalogProductId: number,
  variantId: number,
  imageUrl: string,
  template: { print_area_width: number; print_area_height: number }
): Promise<string | null> {
  try {
    const res = await printful.post(`/mockup-generator/create-task/${catalogProductId}`, {
      variant_ids: [variantId],
      files: [{
        placement: 'front',
        image_url: imageUrl,
        position: {
          area_width: Math.round(template.print_area_width),
          area_height: Math.round(template.print_area_height),
          width: Math.round(template.print_area_width),
          height: Math.round(template.print_area_height),
          top: 0,
          left: 0
        }
      }],
      format: 'jpg'
    })
    return res.data?.result?.task_key ?? null
  } catch (err: any) {
    console.warn(`  Task creation failed: ${err?.response?.data ? JSON.stringify(err.response.data) : err.message}`)
    return null
  }
}

async function pollMockupTask(taskKey: string, maxWaitMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await sleep(3000)
    const res = await printful.get(`/mockup-generator/task`, { params: { task_key: taskKey } })
    const result = res.data?.result
    if (result?.status === 'completed') return result?.mockups as Array<{
      mockup_url?: string
      extra?: Array<{ url: string; title?: string }>
    }>
    if (result?.status === 'failed') {
      console.warn(`  Task failed: ${result?.error}`)
      return []
    }
    process.stdout.write('.')
  }
  console.warn('\n  Timed out')
  return []
}

// Products to process
const PRODUCTS = [
  { syncId: 397486417, name: 'BOWEL BRO SIGHT TEST', catalogProductId: 824 },
  { syncId: 396123470, name: 'OG BOWEL BRO', catalogProductId: 824 },
  { syncId: 425084056, name: 'CROHNIES', catalogProductId: 824 },
]

async function main() {
  if (!apiKey) {
    console.error('PRINTFUL_API_KEY not set')
    process.exit(1)
  }

  console.log('Fetching front template for product 824...')
  const template = await getFrontTemplate(824)
  console.log(`Using template ${template.template_id} (${template.print_area_width}x${template.print_area_height})`)

  for (const product of PRODUCTS) {
    console.log(`\n=== ${product.name} ===`)
    const productDir = path.join(MOCKUPS_DIR, product.name)
    if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true })

    // Fetch sync product details
    const details = await getSyncProductDetails(product.syncId)
    const variant = details.sync_variants[0]
    if (!variant) { console.warn('  No variants found, skipping'); continue }

    const catalogVariantId = variant.product.variant_id
    const designFile = variant.files.find((f) => f.type === 'default')
    if (!designFile?.preview_url) { console.warn('  No design preview URL, skipping'); continue }

    console.log(`  Variant ID: ${catalogVariantId}, design preview: ${designFile.preview_url.slice(-40)}`)

    // Clear existing files
    const existing = fs.readdirSync(productDir).filter((f) => /\.(jpe?g|png)$/i.test(f))
    for (const f of existing) fs.unlinkSync(path.join(productDir, f))
    if (existing.length) console.log(`  Cleared ${existing.length} old file(s)`)

    // Create mockup task
    console.log('  Generating mockups...')
    const taskKey = await createMockupTask(
      product.catalogProductId,
      catalogVariantId,
      designFile.preview_url,
      template
    )

    if (!taskKey) {
      console.warn('  Task creation failed — downloading fallback images only')
      // Fallback: download existing mockup + thumbnail
      const mockupFile = variant.files.find((f) => f.type === 'mockup')
      if (mockupFile?.preview_url) await downloadFile(mockupFile.preview_url, path.join(productDir, 'front.png'))
      if (details.sync_product.thumbnail_url) await downloadFile(details.sync_product.thumbnail_url, path.join(productDir, 'thumbnail-front.png'))
      continue
    }

    console.log(`  Task key: ${taskKey} — polling`)
    const mockups = await pollMockupTask(taskKey)
    console.log(`\n  Received ${mockups.length} mockup set(s)`)

    let downloaded = 0
    for (const mockup of mockups) {
      // Front (main)
      if (mockup.mockup_url) {
        const ok = await downloadFile(mockup.mockup_url, path.join(productDir, 'front.jpg'))
        if (ok) { console.log('  ✓ front.jpg'); downloaded++ }
      }
      // Extra views (Back, Left, Right…)
      for (const extra of mockup.extra ?? []) {
        if (extra.url) {
          const label = (extra.title ?? 'view').toLowerCase().replace(/\s+/g, '-')
          const ok = await downloadFile(extra.url, path.join(productDir, `${label}.jpg`))
          if (ok) { console.log(`  ✓ ${label}.jpg`); downloaded++ }
        }
      }
    }

    // 5th image: product thumbnail (shows the shirt without explicit design overlay — good for context)
    if (details.sync_product.thumbnail_url) {
      const ok = await downloadFile(details.sync_product.thumbnail_url, path.join(productDir, 'thumbnail-front.png'))
      if (ok) { console.log('  ✓ thumbnail-front.png'); downloaded++ }
    }

    const final = fs.readdirSync(productDir).filter((f) => /\.(jpe?g|png)$/i.test(f))
    console.log(`\n  ✅ Total mockups for "${product.name}": ${final.length}`)
    console.log(`     ${final.join(', ')}`)
  }

  console.log('\nAll done!')
}

main().catch((e) => {
  console.error(e?.response?.data ?? e.message ?? e)
  process.exit(1)
})
