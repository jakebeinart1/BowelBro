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
      <div className="card surface-elevated grid gap-4 text-center text-[var(--body-text-muted)]">
        <h1 className="text-3xl font-semibold text-[var(--white)]">Your cart is empty (for now)</h1>
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
        <div className="card surface-elevated">
          <h1 className="text-3xl font-semibold text-[var(--white)]">Your Cart</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--body-text-muted)]">
            Ready when your bowels are. Update quantities, remove items, or head straight to checkout.
          </p>
        </div>

        <div className="grid gap-4">
          {items.map((item) => {
            const price = Number(item.variant.retailPrice ?? 0)
            const lineTotal = price * item.quantity
            const image = item.variant.imageUrl ?? item.variant.product.thumbnailUrl ?? null

            return (
              <div key={item.id} className="card flex flex-col gap-4 border-[rgba(82,121,111,0.35)] bg-[linear-gradient(155deg,rgba(26,77,46,0.92),rgba(10,47,31,0.88))] sm:flex-row sm:gap-6">
                {image ? (
                  <img
                    src={image}
                    alt={item.variant.name}
                    className="h-28 w-full rounded-2xl border border-[rgba(82,121,111,0.45)] object-cover sm:h-28 sm:w-28"
                  />
                ) : null}
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[var(--white)]">{item.variant.product.name}</p>
                    <p className="text-sm text-[var(--body-text-muted)]">{item.variant.name}</p>
                    <p className="mt-1 text-sm text-[var(--body-text-muted)]">{formatPrice(price, currency)} each</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--body-text-muted)]">
                    <form action={updateQuantity} className="flex items-center gap-3">
                      <input type="hidden" name="itemId" value={item.id} />
                      <label className="flex items-center gap-2 rounded-full bg-[rgba(39,174,96,0.12)] px-3 py-1 text-[var(--white)]">
                        Qty
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          max="99"
                          defaultValue={item.quantity}
                          className="w-16 rounded-full border border-transparent bg-[rgba(0,0,0,0.35)] px-3 py-1 text-sm text-[var(--body-text)]"
                        />
                      </label>
                      <button type="submit" className="btn-secondary !border-[rgba(39,174,96,0.45)] !px-4 !py-1 text-[11px] uppercase tracking-[0.25rem]">
                        Update
                      </button>
                    </form>
                    <form action={removeItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className="btn-secondary !border-[rgba(184,115,51,0.45)] !px-4 !py-1 text-[11px] uppercase tracking-[0.25rem] text-[var(--copper)]">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
                <div className="flex items-end justify-end text-right text-base font-semibold text-[var(--white)] sm:min-w-[88px]">
                  {formatPrice(lineTotal, currency)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card h-max space-y-5 border-[rgba(82,121,111,0.45)] bg-[linear-gradient(160deg,rgba(26,77,46,0.92),rgba(10,47,31,0.9))]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--sage)]">Order summary</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[var(--body-text-muted)]">Subtotal</span>
            <span className="text-xl font-semibold text-[var(--accent-green)]">{formatPrice(subtotal, currency)}</span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[var(--body-text-muted)]">
          Shipping and taxes are calculated at checkout. You&apos;ll confirm on the Stripe page before paying.
        </p>
        <form action={checkout}>
          <button className="btn w-full" type="submit">
            Checkout with Stripe
          </button>
        </form>
        <div className="rounded-2xl border border-[rgba(82,121,111,0.35)] bg-[rgba(0,0,0,0.25)] p-4 text-xs text-[var(--body-text-muted)]">
          Your purchase sends support to IBD research and the community. Thank you for being a fellow Bowel Bro.
        </div>
      </div>
    </div>
  )
}
