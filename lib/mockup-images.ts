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
}

const VIEW_PRIORITY: MockupView[] = ['front', 'lifestyle', 'back', 'detail', 'flat']

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

const directoryCache = new Map<string, { base: string; dir: string }>()

export function getMockupSlug(productName: string, explicitSlug?: string | null) {
  if (explicitSlug?.trim()) return explicitSlug.trim().toLowerCase()
  return slugify(productName)
}

function resolveMockupDirectory(productName: string, explicitSlug?: string | null) {
  const slug = getMockupSlug(productName, explicitSlug)
  const cacheKey = `${slug}::${explicitSlug ?? ''}`
  if (directoryCache.has(cacheKey)) {
    return { slug, ...directoryCache.get(cacheKey)! }
  }

  for (const base of MOCKUP_ROOTS) {
    if (!fs.existsSync(base)) continue
    const candidate = path.join(base, slug)
    if (fs.existsSync(candidate)) {
      const result = { base, dir: slug }
      directoryCache.set(cacheKey, result)
      return { slug, ...result }
    }
  }

  for (const base of MOCKUP_ROOTS) {
    if (!fs.existsSync(base)) continue
    try {
      const entries = fs.readdirSync(base, { withFileTypes: true })
      const match = entries.find((entry) => entry.isDirectory() && slugify(entry.name) === slug)
      if (match) {
        const result = { base, dir: match.name }
        directoryCache.set(cacheKey, result)
        return { slug, ...result }
      }
    } catch {
      // ignore
    }
  }

  const fallbackBase = MOCKUP_ROOTS.find((base) => fs.existsSync(base)) ?? MOCKUP_ROOTS[0]
  const result = { base: fallbackBase, dir: slug }
  directoryCache.set(cacheKey, result)
  return { slug, ...result }
}

function getAbsoluteMockupPath(productName: string, view: MockupView, explicitSlug?: string | null) {
  const { base, dir } = resolveMockupDirectory(productName, explicitSlug)
  return path.join(base, dir, `${view}.jpg`)
}

export function getMockupPath(productName: string, view: MockupView = 'front', explicitSlug?: string | null) {
  const { slug } = resolveMockupDirectory(productName, explicitSlug)
  return `/mockups/${slug}/${view}.jpg`
}

export function mockupExists(productName: string, view: MockupView = 'front', explicitSlug?: string | null) {
  try {
    return fs.existsSync(getAbsoluteMockupPath(productName, view, explicitSlug))
  } catch {
    return false
  }
}

export function getMockupFile(productName: string, view: MockupView, explicitSlug?: string | null) {
  const filePath = getAbsoluteMockupPath(productName, view, explicitSlug)
  if (fs.existsSync(filePath)) return filePath
  return null
}

export function getProductImage(
  productName: string,
  view: MockupView = 'front',
  fallback?: string | null,
  explicitSlug?: string | null
) {
  if (mockupExists(productName, view, explicitSlug)) {
    return getMockupPath(productName, view, explicitSlug)
  }
  if (fallback) return fallback
  return FALLBACK_PLACEHOLDER
}

export function getAvailableMockupViews(productName: string, explicitSlug?: string | null) {
  return VIEW_PRIORITY.filter((view) => mockupExists(productName, view, explicitSlug))
}

export function getPrimaryMockupImage(
  productName: string,
  fallbacks: Array<string | null | undefined> = [],
  explicitSlug?: string | null
) {
  const available = getAvailableMockupViews(productName, explicitSlug)
  if (available.length) return getMockupPath(productName, available[0], explicitSlug)

  const fallback = fallbacks.find((src) => typeof src === 'string' && src.length)
  return fallback ?? FALLBACK_PLACEHOLDER
}

export function buildMockupGallery(
  productName: string,
  fallbacks: Array<string | null | undefined> = [],
  explicitSlug?: string | null
): MockupGalleryImage[] {
  const available = getAvailableMockupViews(productName, explicitSlug)
  if (available.length) {
    return available.map((view) => ({ view, url: getMockupPath(productName, view, explicitSlug) }))
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
      .map((url, index) => ({ view: `fallback-${index + 1}`, url }))
  }

  return [{ view: 'placeholder', url: FALLBACK_PLACEHOLDER }]
}

export function getMockupPlaceholder() {
  return FALLBACK_PLACEHOLDER
}
