import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { addVariantToCart } from '@/lib/cart'

export const runtime = 'nodejs'

function formatPrice(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return '$0.00'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      variants: {
        where: { isEnabled: true },
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!product) notFound()

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    imageUrl: variant.imageUrl ?? product.thumbnailUrl ?? null,
    price: Number(variant.retailPrice),
    currency: (variant.currency || product.currency || 'usd').toUpperCase()
  }))

  const defaultVariant = variants[0]
  const heroImage = defaultVariant?.imageUrl ?? product.thumbnailUrl ?? null

  async function addToCart(formData: FormData) {
    'use server'
    const productId = String(formData.get('productId') ?? '')
    const variantId = String(formData.get('variantId') ?? '')
    const quantity = Number(formData.get('quantity') ?? '1')

    if (!variantId) throw new Error('Variant is required')

    const variant = await prisma.variant.findFirst({
      where: { id: variantId, productId, isEnabled: true }
    })
    if (!variant) throw new Error('Variant unavailable')

    try {
      await addVariantToCart(variantId, quantity)
    } catch (err) {
      console.error('Failed to add to cart', err)
      throw err
    }

    revalidatePath('/cart')
    redirect('/cart')
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr]">
      <div className="relative overflow-hidden rounded-3xl border border-[#efe6d9] bg-white/70 shadow-[0_30px_60px_-45px_rgba(39,31,24,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.12),_transparent_55%)]" />
        <div className="relative aspect-[4/5] w-full">
          {heroImage ? (
            <img
              src={heroImage}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#8a7b70]">Imagery coming soon</div>
          )}
        </div>
        {product.description ? (
          <div className="relative border-t border-[#efe6d9] bg-white/85 p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#8a7b70]">Story</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#544a42]">{product.description}</p>
          </div>
        ) : null}
      </div>

      <aside className="card space-y-7">
        <div className="space-y-3">
          <a className="text-xs font-semibold uppercase tracking-[0.3rem] text-[#8a7b70]" href="/products">
            ← Back to all tees
          </a>
          <h1 className="text-3xl font-semibold text-[#1f1d1a]">{product.name}</h1>
          {defaultVariant ? (
            <p className="text-lg text-[#534941]">
              From {formatPrice(defaultVariant.price, defaultVariant.currency)}
            </p>
          ) : (
            <p className="text-sm text-[#8a7b70]">No variants available right now.</p>
          )}
        </div>

        {variants.length ? (
          <form action={addToCart} className="grid gap-5">
            <input type="hidden" name="productId" value={product.id} />
            <label className="grid gap-2 text-sm font-medium text-[#544a42]">
              Variant
              <select
                name="variantId"
                defaultValue={defaultVariant?.id}
                className="rounded-2xl border border-[#e9e1d7] bg-white px-4 py-2 text-sm text-[#1f1d1a] shadow-inner"
                required
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} · {formatPrice(variant.price, variant.currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#544a42]">
              Quantity
              <input
                className="w-24 rounded-2xl border border-[#e9e1d7] bg-white px-3 py-2 text-sm"
                type="number"
                name="quantity"
                min="1"
                max="10"
                defaultValue="1"
              />
            </label>

            <button className="btn" type="submit">
              Add to cart
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e7ded2] bg-white/65 p-5 text-sm text-[#8a7b70]">
            We&apos;re restocking this item. Check back soon!
          </div>
        )}

        <div className="grid gap-4 rounded-2xl bg-[#f9f6ef] p-5 text-sm text-[#544a42]">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            Printed on premium, breathable cotton blend.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" />
            Packaged and shipped by Printful within 3-5 business days.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#334155]" />
            Every dollar of profit is donated to IBD research and patient support.
          </div>
        </div>
      </aside>
    </div>
  )
}
