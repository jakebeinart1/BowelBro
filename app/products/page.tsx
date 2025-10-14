// app/products/page.tsx

// Force server runtime and fresh data
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '../../lib/db' // use relative import, no @/ alias needed

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
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

  return (
    <div className="grid gap-10">
      <header className="grid gap-4 rounded-3xl border border-[var(--border)] bg-white/75 p-8 shadow-[0_24px_50px_-34px_rgba(20,18,15,0.55)] backdrop-blur">
        <span className="inline-flex w-max items-center gap-2 rounded-full bg-[rgba(61,139,132,0.12)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--teal)]">
          Shop the drop
        </span>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Fresh tees for every Bowel Bro</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text)]/80">
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
              <article key={product.id} className="card h-full overflow-hidden bg-[linear-gradient(140deg,rgba(52,78,65,0.08),rgba(255,255,255,0.95))]">
                <div className="relative overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.72)] shadow-inner">
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
                    <h3 className="text-lg font-semibold text-[var(--text)]">{product.name}</h3>
                    {samplePrice ? (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">Starting at ${samplePrice}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-2 text-sm text-[var(--text)]/75">
                    {product.variants.slice(0, 3).map((variant) => (
                      <div key={variant.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        <span>{variant.name}</span>
                      </div>
                    ))}
                    {product.variants.length > 3 ? (
                      <span className="text-xs uppercase tracking-[0.2rem] text-[var(--text-muted)]/80">
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
