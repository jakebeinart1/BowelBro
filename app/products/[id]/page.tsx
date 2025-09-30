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
    <div className="grid gap-10 lg:grid-cols-[1.5fr,1fr]">
      <div className="space-y-6">
        {heroImage ? (
          <img
            src={heroImage}
            alt={product.name}
            className="w-full rounded-2xl border object-cover"
          />
        ) : null}
        {product.description ? <p className="text-gray-600 leading-relaxed">{product.description}</p> : null}
      </div>
      <div className="card space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          {defaultVariant ? (
            <p className="mt-2 text-lg text-gray-600">
              From {formatPrice(defaultVariant.price, defaultVariant.currency)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No variants available right now.</p>
          )}
        </div>

        {variants.length ? (
          <form action={addToCart} className="grid gap-4">
            <input type="hidden" name="productId" value={product.id} />
            <label className="grid gap-2 text-sm font-medium">
              Variant
              <select
                name="variantId"
                defaultValue={defaultVariant?.id}
                className="rounded-xl border px-3 py-2"
                required
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} · {formatPrice(variant.price, variant.currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Quantity
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                name="quantity"
                min="1"
                max="10"
                defaultValue="1"
              />
            </label>

            <button className="btn mt-2" type="submit">
              Add to cart
            </button>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-gray-500">
            We&apos;re restocking this item. Check back soon!
          </div>
        )}
      </div>
    </div>
  )
}
