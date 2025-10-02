import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { addVariantToCart } from '@/lib/cart'
import { ProductGallery } from '@/components/product-gallery'

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

  const gallerySet = new Set<string>()
  const galleryImages: Array<{ url: string; alt: string }> = []

  if (product.thumbnailUrl) {
    gallerySet.add(product.thumbnailUrl)
    galleryImages.push({ url: product.thumbnailUrl, alt: `${product.name} thumbnail` })
  }

  for (const variant of variants) {
    if (variant.imageUrl && !gallerySet.has(variant.imageUrl)) {
      gallerySet.add(variant.imageUrl)
      galleryImages.push({ url: variant.imageUrl, alt: `${product.name} – ${variant.name}` })
    }
  }

  if (!galleryImages.length && defaultVariant?.imageUrl) {
    galleryImages.push({ url: defaultVariant.imageUrl, alt: product.name })
  }

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
      <div className="space-y-6">
        <ProductGallery images={galleryImages} />
        {product.description ? (
          <div className="rounded-3xl border border-[var(--border)] bg-white/85 p-8 shadow-[0_20px_45px_-36px_rgba(22,20,18,0.55)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--text-muted)]">Story</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text)]/80">{product.description}</p>
          </div>
        ) : null}
      </div>

      <aside className="card space-y-7 bg-[linear-gradient(140deg,rgba(218,233,245,0.7),rgba(253,240,213,0.7))]">
        <div className="space-y-3">
          <a className="text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--text-muted)]" href="/products">
            ← Back to all tees
          </a>
          <h1 className="text-3xl font-semibold text-[var(--accent)]">{product.name}</h1>
          {defaultVariant ? (
            <p className="text-lg text-[var(--text)]/85">
              From {formatPrice(defaultVariant.price, defaultVariant.currency)}
            </p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No variants available right now.</p>
          )}
        </div>

        {variants.length ? (
          <form action={addToCart} className="grid gap-5">
            <input type="hidden" name="productId" value={product.id} />
            <fieldset className="grid gap-3 text-sm font-medium text-[var(--text)]/85">
              <legend className="text-[var(--teal)]">Variant</legend>
              <div className="grid gap-2">
                {variants.map((variant) => {
                  const primaryImage = variant.imageUrl
                  return (
                    <label
                      key={variant.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-3 py-2 shadow-sm transition hover:border-[var(--accent)]/40"
                    >
                      <input
                        type="radio"
                        name="variantId"
                        value={variant.id}
                        defaultChecked={variant.id === defaultVariant?.id}
                        className="accent-[#344e41]"
                        required
                      />
                      {primaryImage ? (
                        <img src={primaryImage} alt={variant.name} className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(52,78,65,0.08)] text-[10px] uppercase text-[var(--text-muted)]">
                          No Img
                        </span>
                      )}
                      <span className="flex flex-1 flex-col">
                        <span className="font-semibold text-[var(--text)]">{variant.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">{formatPrice(variant.price, variant.currency)}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <label className="grid gap-2 text-sm font-medium text-[var(--teal)]">
              Quantity
              <input
                className="w-24 rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
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
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-5 text-sm text-[var(--text-muted)]">
            We&apos;re restocking this item. Check back soon!
          </div>
        )}

        <div className="grid gap-4 rounded-2xl bg-white/70 p-5 text-sm text-[var(--text)]/80">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Printed on premium, breathable cotton blend.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[rgba(217,133,106,0.6)]" />
            Packaged and shipped by Printful within 3-5 business days.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[rgba(34,50,57,0.7)]" />
            Every dollar of profit is donated to IBD research and patient support.
          </div>
        </div>
      </aside>
    </div>
  )
}
