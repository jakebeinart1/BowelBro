import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  const subtotal = items.reduce((sum, item) => sum + Number(item.variant.retailPrice ?? 0) * item.quantity, 0)

  const updateQuantity = async (formData: FormData) => {
    'use server'
    const itemId = String(formData.get('itemId') ?? '')
    const quantity = Number(formData.get('quantity') ?? '1')

    try {
      await updateCartItemQuantity(itemId, quantity)
    } catch (error) {
      console.error('Failed to update cart item', error)
    }

    revalidatePath('/cart')
  }

  const removeItem = async (formData: FormData) => {
    'use server'
    const itemId = String(formData.get('itemId') ?? '')

    try {
      await removeCartItem(itemId)
    } catch (error) {
      console.error('Failed to remove cart item', error)
    }

    revalidatePath('/cart')
  }

  const checkout = async () => {
    'use server'
    const cartId = cookies().get('cartId')?.value
    if (!cartId) {
      redirect('/products')
    }

    const origin = process.env.NEXTAUTH_URL || getRequestOrigin()
    const session = await createCheckoutSession({ cartId, origin })
    if (!session.url) {
      throw new Error('Stripe session missing redirect URL')
    }

    redirect(session.url)
  }

  if (items.length === 0) {
    return (
      <div className="card grid gap-4 text-center text-[#544a42]">
        <h1 className="text-3xl font-semibold text-[#1f1d1a]">Your cart is empty (for now)</h1>
        <p>Grab a tee that speaks to your gut and give the IBD community a boost.</p>
        <div className="flex justify-center gap-3">
          <a className="btn" href="/products">
            Browse products
          </a>
          <a className="btn-secondary" href="/">
            Visit homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6">
        <div className="card bg-white/85">
          <h1 className="text-3xl font-semibold text-[#1f1d1a]">Your Cart</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#544a42]">
            Ready when your bowels are. Update quantities, remove items, or head straight to checkout.
          </p>
        </div>

        <div className="grid gap-4">
          {items.map((item) => {
            const price = Number(item.variant.retailPrice ?? 0)
            const lineTotal = price * item.quantity
            const image = item.variant.imageUrl ?? item.variant.product.thumbnailUrl ?? null

            return (
              <div key={item.id} className="card flex flex-col gap-4 sm:flex-row sm:gap-6">
                {image ? (
                  <img
                    src={image}
                    alt={item.variant.name}
                    className="h-28 w-full rounded-2xl object-cover sm:h-28 sm:w-28"
                  />
                ) : null}
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#1f1d1a]">{item.variant.product.name}</p>
                    <p className="text-sm text-[#8a7b70]">{item.variant.name}</p>
                    <p className="mt-1 text-sm text-[#544a42]">{formatPrice(price, currency)} each</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#544a42]">
                    <form action={updateQuantity} className="flex items-center gap-3">
                      <input type="hidden" name="itemId" value={item.id} />
                      <label className="flex items-center gap-2 rounded-full bg-[#f3ede4] px-3 py-1">
                        Qty
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          max="99"
                          defaultValue={item.quantity}
                          className="w-16 rounded-full border border-transparent bg-white px-3 py-1 text-sm"
                        />
                      </label>
                      <button type="submit" className="text-xs font-semibold uppercase tracking-[0.2rem] text-[#8a7b70]">
                        Update
                      </button>
                    </form>
                    <form action={removeItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className="text-xs font-semibold uppercase tracking-[0.2rem] text-[#8a7b70]">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
                <div className="flex items-end justify-end text-right text-base font-semibold text-[#1f1d1a] sm:min-w-[88px]">
                  {formatPrice(lineTotal, currency)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card h-max space-y-5 bg-white/85">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3rem] text-[#8a7b70]">Order summary</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[#544a42]">Subtotal</span>
            <span className="text-xl font-semibold text-[#1f1d1a]">{formatPrice(subtotal, currency)}</span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[#8a7b70]">
          Shipping and taxes are calculated at checkout. You&apos;ll confirm on the Stripe page before paying.
        </p>
        <form action={checkout}>
          <button className="btn w-full" type="submit">
            Checkout with Stripe
          </button>
        </form>
        <div className="rounded-2xl bg-[#f9f6ef] p-4 text-xs text-[#544a42]">
          Your purchase sends support to IBD research and the community. Thank you for being a fellow Bowel Bro.
        </div>
      </div>
    </div>
  )
}
