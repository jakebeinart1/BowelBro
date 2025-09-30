import React from 'react'

type Variant = { id: string; name: string; imageUrl?: string; retailPrice: string }
type Product = { id: string; name: string; thumbnailUrl?: string; variants: Variant[] }

export default async function ProductsPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/printful/products`, { cache: 'no-store' })
  const data = await res.json()
  const products: Product[] = data.products ?? []
  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-semibold">Products</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <div className="card" key={p.id}>
            {p.thumbnailUrl ? <img className="w-full rounded-xl" src={p.thumbnailUrl} alt={p.name} /> : null}
            <h3 className="mt-2 font-semibold">{p.name}</h3>
            <div className="mt-2 text-sm">
              {p.variants.slice(0,3).map(v => (<div key={v.id}>{v.name}</div>))}
            </div>
            <a className="btn mt-3" href={`/products/${p.id}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  )
}
