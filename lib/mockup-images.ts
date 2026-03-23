import fs from 'fs'
import path from 'path'

const MOCKUP_ROOTS = [
  path.join(process.cwd(), 'public', 'mockups'),
  path.join(process.cwd(), 'mockups')
]

export const MOCKUP_VIEWS = ['front', 'lifestyle', 'back', 'detail', 'flat'] as const
export type MockupView = (typeof MOCKUP_VIEWS)[number]

export type MockupGalleryImage = {
  view: string
  url: string
  label: string
}

type MockupFileEntry = {
  view: MockupView | null
  fileName: string
  absolutePath: string
}

const VIEW_PRIORITY: MockupView[] = ['front', 'lifestyle', 'back', 'detail', 'flat']

const VIEW_MATCHERS: Record<MockupView, RegExp[]> = {
  front: [/(?:^|[-_\s])front(?:[-_.\s]|$)/i, /hero/i, /primary/i],
  lifestyle: [/lifestyle/i, /scene/i, /model/i, /outdoor/i],
  back: [/(?:^|[-_\s])back(?:[-_.\s]|$)/i, /rear/i],
  detail: [/detail/i, /close/i, /zoom/i, /texture/i, /stitch/i],
  flat: [/flat/i, /lay/i, /fold/i]
}

const FALLBACK_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d4ebe5" />
          <stop offset="100%" stop-color="#f4dec9" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#grad)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="600" font-size="28" fill="#1a4d2e" opacity="0.72">
        Mockup coming soon
      </text>
    </svg>`
  )

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['`´’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
}

const directoryCache = new Map<string, { base: string; dir: string; slug: string }>()
const fileCache = new Map<string, MockupFileEntry[]>()

export function getMockupSlug(productName: string, explicitSlug?: string | null) {
  if (explicitSlug?.trim()) return explicitSlug.trim().toLowerCase()
  return slugify(productName)
}

function resolveMockupDirectory(productName: string, explicitSlug?: string | null) {
  const slug = getMockupSlug(productName, explicitSlug)
  const cacheKey = `${slug}::${explicitSlug ?? ''}`
  if (directoryCache.has(cacheKey)) return directoryCache.get(cacheKey)!

  for (const base of MOCKUP_ROOTS) {
    if (!fs.existsSync(base)) continue
    const direct = path.join(base, slug)
    if (fs.existsSync(direct)) {
      const result = { base, dir: slug, slug }
      directoryCache.set(cacheKey, result)
      return result
    }
  }

  for (const base of MOCKUP_ROOTS) {
    if (!fs.existsSync(base)) continue
    try {
      const entries = fs.readdirSync(base, { withFileTypes: true })
      const match = entries.find((entry) => entry.isDirectory() && slugify(entry.name) === slug)
      if (match) {
        const result = { base, dir: match.name, slug }
        directoryCache.set(cacheKey, result)
        return result
      }
    } catch {
      // ignore
    }
  }

  const fallbackBase = MOCKUP_ROOTS.find((base) => fs.existsSync(base)) ?? MOCKUP_ROOTS[0]
  const result = { base: fallbackBase, dir: slug, slug }
  directoryCache.set(cacheKey, result)
  return result
}

function detectView(fileName: string): MockupView | null {
  const lower = fileName.toLowerCase()
  for (const view of VIEW_PRIORITY) {
    const matchers = VIEW_MATCHERS[view]
    if (matchers.some((regex) => regex.test(lower))) return view
  }
  return null
}

function listMockupFiles(productName: string, explicitSlug?: string | null) {
  const { base, dir, slug } = resolveMockupDirectory(productName, explicitSlug)
  const cacheKey = `${base}::${dir}`
  if (fileCache.has(cacheKey)) return { slug, entries: fileCache.get(cacheKey)! }

  let entries: MockupFileEntry[] = []
  try {
    const files = fs
      .readdirSync(path.join(base, dir), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => /\.(jpe?g|png)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    entries = files.map((fileName) => ({
      view: detectView(fileName),
      fileName,
      absolutePath: path.join(base, dir, fileName)
    }))
  } catch {
    entries = []
  }

  fileCache.set(cacheKey, entries)
  return { slug, entries }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function deriveOrientationTokens(entry: MockupFileEntry) {
  if (!entry.view) return []
  const lower = entry.fileName.toLowerCase()
  const tokens = new Set<string>()

  if (entry.view !== 'lifestyle' && /left/.test(lower)) tokens.add('Left')
  if (entry.view !== 'lifestyle' && /right/.test(lower)) tokens.add('Right')
  if (/angle/.test(lower)) tokens.add('Angle')
  if (/side/.test(lower)) tokens.add('Side')
  if (/close|zoom|detail|macro/.test(lower) && entry.view !== 'detail') tokens.add('Detail')
  if (/flat/.test(lower) && entry.view !== 'flat') tokens.add('Flat')
  if (/lifestyle|scene|model|outdoor|indoor/.test(lower) && entry.view !== 'lifestyle') tokens.add('Lifestyle')
  if (/back/.test(lower) && entry.view !== 'back') tokens.add('Back')
  if (/front/.test(lower) && entry.view !== 'front') tokens.add('Front')

  return Array.from(tokens)
}

function formatLabel(entry: MockupFileEntry, count: number) {
  if (entry.view) {
    const base = capitalize(entry.view)
    const orientation = deriveOrientationTokens(entry)
    if (orientation.length) return `${base} ${orientation.join(' ')}`
    if (count > 1) return `${base} ${count}`
    return base
  }
  return `Mockup ${count}`
}

function buildMockupUrl(slug: string, fileName: string) {
  return `/mockups/${encodeURIComponent(slug)}/${encodeURIComponent(fileName)}`
}

export function getMockupPath(productName: string, view: MockupView = 'front', explicitSlug?: string | null) {
  const { slug, entries } = listMockupFiles(productName, explicitSlug)
  const match = entries.find((entry) => entry.view === view)
  if (!match) return null
  return buildMockupUrl(slug, match.fileName)
}

export function mockupExists(productName: string, view: MockupView = 'front', explicitSlug?: string | null) {
  return Boolean(getMockupPath(productName, view, explicitSlug))
}

export function getMockupFile(productName: string, view: MockupView, explicitSlug?: string | null) {
  const { entries } = listMockupFiles(productName, explicitSlug)
  const match = entries.find((entry) => entry.view === view)
  return match?.absolutePath ?? null
}

export function getMockupFileByName(productName: string, fileName: string, explicitSlug?: string | null) {
  const { entries } = listMockupFiles(productName, explicitSlug)
  const target = decodeURIComponent(fileName)
  const match = entries.find((entry) => entry.fileName.toLowerCase() === target.toLowerCase())
  return match?.absolutePath ?? null
}

export function getProductImage(
  productName: string,
  view: MockupView = 'front',
  fallback?: string | null,
  explicitSlug?: string | null
) {
  const url = getMockupPath(productName, view, explicitSlug)
  if (url) return url
  const primary = getPrimaryMockupImage(productName, fallback ? [fallback] : [], explicitSlug)
  if (primary) return primary
  if (fallback) return fallback
  return FALLBACK_PLACEHOLDER
}

export function getAvailableMockupViews(productName: string, explicitSlug?: string | null) {
  const { entries } = listMockupFiles(productName, explicitSlug)
  const seen = new Set<MockupView>()
  for (const entry of entries) {
    if (entry.view && !seen.has(entry.view)) seen.add(entry.view)
  }
  return Array.from(seen)
}

function getOrderedEntries(productName: string, explicitSlug?: string | null) {
  const { slug, entries } = listMockupFiles(productName, explicitSlug)
  const ordered = entries
    .slice()
    .sort((a, b) => {
      const aPriority = a.view ? VIEW_PRIORITY.indexOf(a.view) : VIEW_PRIORITY.length
      const bPriority = b.view ? VIEW_PRIORITY.indexOf(b.view) : VIEW_PRIORITY.length
      if (aPriority !== bPriority) return aPriority - bPriority
      return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
    })
  return { slug, entries: ordered }
}

export function getPrimaryMockupImage(
  productName: string,
  fallbacks: Array<string | null | undefined> = [],
  explicitSlug?: string | null
) {
  const { slug, entries } = getOrderedEntries(productName, explicitSlug)
  if (entries.length) {
    return buildMockupUrl(slug, entries[0].fileName)
  }

  const fallback = fallbacks.find((src) => typeof src === 'string' && src.length)
  return fallback ?? FALLBACK_PLACEHOLDER
}

export function buildMockupGallery(
  productName: string,
  fallbacks: Array<string | null | undefined> = [],
  explicitSlug?: string | null
): MockupGalleryImage[] {
  const { slug, entries } = getOrderedEntries(productName, explicitSlug)
  if (entries.length) {
    const counts = new Map<string, number>()
    return entries.map((entry) => {
      const key = entry.view ?? 'mockup'
      const currentCount = (counts.get(key) ?? 0) + 1
      counts.set(key, currentCount)

      const viewId = entry.view ? (currentCount > 1 ? `${entry.view}-${currentCount}` : entry.view) : `mockup-${currentCount}`
      const label = formatLabel(entry, currentCount)

      return {
        view: viewId,
        url: buildMockupUrl(slug, entry.fileName),
        label
      }
    })
  }

  const fallbackSources = fallbacks.filter((src): src is string => Boolean(src))
  if (fallbackSources.length) {
    const seen = new Set<string>()
    return fallbackSources
      .filter((url) => {
        if (seen.has(url)) return false
        seen.add(url)
        return true
      })
      .map((url, index) => ({ view: `fallback-${index + 1}`, url, label: `Fallback ${index + 1}` }))
  }

  return [{ view: 'placeholder', url: FALLBACK_PLACEHOLDER, label: 'Mockup placeholder' }]
}

export function getMockupPlaceholder() {
  return FALLBACK_PLACEHOLDER
}

export function clearMockupCaches() {
  directoryCache.clear()
  fileCache.clear()
}
