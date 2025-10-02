// app/products/page.tsx

// Force server runtime and fresh data
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '../../lib/db' // use relative import, no @/ alias needed

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      variants: {
        select: { id: true, name: true, imageUrl: true, retailPrice: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="grid gap-10">
      <header className="grid gap-4 rounded-3xl border border-[#efe6d9] bg-white/70 p-8 shadow-[0_20px_45px_-38px_rgba(37,29,22,0.6)] backdrop-blur">
        <span className="text-xs font-semibold uppercase tracking-[0.3rem] text-[#8a7b70]">Shop the drop</span>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#1f1d1a]">Fresh tees for every Bowel Bro</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#544a42]">
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
        <div className="card text-center text-sm text-[#544a42]">
          <p>No products yet—run the admin sync to pull in your Printful catalog.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const preview = product.thumbnailUrl || product.variants[0]?.imageUrl || null
            const price = product.variants[0]?.retailPrice
            const samplePrice = price ? Number(price).toFixed(2) : null

            return (
              <article key={product.id} className="card h-full overflow-hidden">
                <div className="relative overflow-hidden rounded-2xl bg-[#f5f2ea]">
                  {preview ? (
                    <img
                      src={preview}
                      alt={product.name}
                      className="h-56 w-full object-cover transition duration-300 hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center text-sm text-[#8a7b70]">
                      Preview coming soon
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0f766e]/10 via-transparent to-transparent" />
                </div>
                <div className="mt-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f1d1a]">{product.name}</h3>
                    {samplePrice ? (
                      <p className="mt-1 text-sm text-[#8a7b70]">Starting at ${samplePrice}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-2 text-sm text-[#544a42]">
                    {product.variants.slice(0, 3).map((variant) => (
                      <div key={variant.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />
                        <span>{variant.name}</span>
                      </div>
                    ))}
                    {product.variants.length > 3 ? (
                      <span className="text-xs uppercase tracking-[0.2rem] text-[#8a7b70]">
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
