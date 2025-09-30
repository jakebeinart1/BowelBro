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
    <div className="grid gap-6">
      <h2 className="text-2xl font-semibold">Products</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div className="card" key={p.id}>
            {p.thumbnailUrl ? (
              <img className="w-full rounded-xl" src={p.thumbnailUrl} alt={p.name} />
            ) : null}
            <h3 className="mt-2 font-semibold">{p.name}</h3>
            <div className="mt-2 text-sm">
              {p.variants.slice(0, 3).map((v) => (
                <div key={v.id}>{v.name}</div>
              ))}
            </div>
            <a className="btn mt-3" href={`/products/${p.id}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  )
}
