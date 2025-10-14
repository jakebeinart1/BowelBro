// app/products/page.tsx

// Force server runtime and fresh data
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '../../lib/db' // use relative import, no @/ alias needed
import { retry } from '../../lib/retry'

export default async function ProductsPage() {
  const products = await retry(() =>
    prisma.product.findMany({
      where: { isActive: true, variants: { some: { isEnabled: true } } },
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        variants: {
          where: { isEnabled: true },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            retailPrice: true,
            mockups: {
              select: { url: true, position: true },
              orderBy: { position: 'asc' }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  )

  return (
    <div className="grid gap-10">
      <header className="grid gap-4 rounded-3xl border border-[var(--border-light)] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <span className="badge-premium text-[#0b2a1b]">Shop the drop</span>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--green-dark)]">Fresh tees for every Bowel Bro</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Rotating designs, endless gut jokes, and heartfelt statements—each one printed on demand so nothing goes to waste, with 100% of profits funding IBD research and support.
            </p>
          </div>
          <div className="flex gap-2">
            <a className="btn-secondary" href="/">
              Back to home
            </a>
            <a className="btn" href="/cart">
              View cart
            </a>
          </div>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="card text-center text-sm text-[var(--text)]/75">
          <p>No products yet—run the admin sync to pull in your Printful catalog.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const preview =
              product.thumbnailUrl ||
              product.variants[0]?.mockups[0]?.url ||
              product.variants[0]?.imageUrl ||
              null
            const price = product.variants[0]?.retailPrice
            const samplePrice = price ? Number(price).toFixed(2) : null

            return (
              <article key={product.id} className="card h-full overflow-hidden">
                <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-soft)]">
                  {preview ? (
                    <img
                      src={preview}
                      alt={product.name}
                      className="h-56 w-full object-cover transition duration-300 hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center text-sm text-[var(--text-muted)]">
                      Preview coming soon
                    </div>
                  )}
                </div>
                  <div className="mt-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--green-dark)]">{product.name}</h3>
                      {samplePrice ? (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">Starting at ${samplePrice}</p>
                      ) : null}
                    </div>
                  <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
                    {product.variants.slice(0, 3).map((variant) => (
                      <div key={variant.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--green-accent)]" />
                        <span>{variant.name}</span>
                      </div>
                    ))}
                    {product.variants.length > 3 ? (
                      <span className="text-xs uppercase tracking-[0.2rem] text-[var(--green-sage)]">
                        +{product.variants.length - 3} more variants
                      </span>
                    ) : null}
                  </div>
                  <a className="btn self-start" href={`/products/${product.id}`}>
                    View details
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
