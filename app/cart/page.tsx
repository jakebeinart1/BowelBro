import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCartWithItems, updateCartItemQuantity, removeCartItem } from '@/lib/cart'
import { createCheckoutSession } from '@/lib/checkout'
import { getRequestOrigin } from '@/lib/origin'

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

export default async function CartPage() {
  const cart = await getCartWithItems()
  const items = cart?.items ?? []
  const currency = (items[0]?.variant.currency ?? 'usd').toUpperCase()
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.variant.retailPrice ?? 0) * item.quantity
  }, 0)

  async function updateQuantity(formData: FormData) {
    'use server'
    const itemId = String(formData.get('itemId') ?? '')
    const quantity = Number(formData.get('quantity') ?? '1')
    try {
      await updateCartItemQuantity(itemId, quantity)
    } catch (err) {
      console.error('Failed to update cart item', err)
    }
    revalidatePath('/cart')
  }

  async function removeItem(formData: FormData) {
    'use server'
    const itemId = String(formData.get('itemId') ?? '')
    try {
      await removeCartItem(itemId)
    } catch (err) {
      console.error('Failed to remove cart item', err)
    }
    revalidatePath('/cart')
  }

  async function checkout() {
    'use server'
    const cartId = cookies().get('cartId')?.value
    if (!cartId) redirect('/products')
    const origin = process.env.NEXTAUTH_URL || getRequestOrigin()
    const session = await createCheckoutSession({ cartId, origin })
    if (!session.url) throw new Error('Stripe session missing redirect URL')
    redirect(session.url)
  }

  if (!items.length) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-semibold">Your Cart</h1>
        <p className="text-gray-600">Your cart is empty right now.</p>
        <a className="btn w-max" href="/products">
          Browse products
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Your Cart</h1>
        <div className="space-y-4">
          {items.map((item) => {
            const price = Number(item.variant.retailPrice ?? 0)
            const lineTotal = price * item.quantity
            const image = item.variant.imageUrl ?? item.variant.product.thumbnailUrl ?? null

            return (
              <div key={item.id} className="card flex gap-4">
                {image ? (
                  <img src={image} alt={item.variant.name} className="h-24 w-24 rounded-xl object-cover" />
                ) : null}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-medium">{item.variant.product.name}</p>
                    <p className="text-sm text-gray-500">{item.variant.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">{formatPrice(price, currency)} each</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <form action={updateQuantity} className="flex items-center gap-2">
                      <input type="hidden" name="itemId" value={item.id} />
                      <label className="flex items-center gap-2">
                        Qty
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          max="99"
                          defaultValue={item.quantity}
                          className="w-16 rounded-lg border px-2 py-1"
                        />
                      </label>
                      <button type="submit" className="text-xs font-medium uppercase text-gray-500">
                        Update
                      </button>
                    </form>
                    <form action={removeItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className="text-xs font-medium uppercase text-gray-500">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
                <div className="text-right font-medium">{formatPrice(lineTotal, currency)}</div>
              </div>
            )
          })
        </div>
      </div>

      <div className="card h-max space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Subtotal</span>
          <span className="text-lg font-semibold">{formatPrice(subtotal, currency)}</span>
        </div>
        <p className="text-sm text-gray-500">Shipping and taxes are calculated at checkout.</p>
        <form action={checkout}>
          <button className="btn w-full" type="submit">
            Checkout with Stripe
          </button>
        </form>
      </div>
    </div>
  )
}
