import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

const CART_COOKIE = 'cartId'
const CART_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function setCartCookie(id: string) {
  const store = cookies()
  store.set(CART_COOKIE, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CART_MAX_AGE
  })
}

async function ensureCartId() {
  const store = cookies()
  const existing = store.get(CART_COOKIE)?.value

  if (existing) {
    const cart = await prisma.cart.findUnique({ where: { id: existing } })
    if (cart) return existing
  }

  const cart = await prisma.cart.create({ data: {} })
  setCartCookie(cart.id)
  return cart.id
}

export async function addVariantToCart(variantId: string, quantity: number) {
  const safeQty = Math.max(1, Math.min(99, Math.trunc(quantity)))
  const variant = await prisma.variant.findUnique({ where: { id: variantId } })
  if (!variant || !variant.isEnabled) throw new Error('Variant unavailable')

  const cartId = await ensureCartId()
  const existing = await prisma.cartItem.findFirst({ where: { cartId, variantId } })

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(99, existing.quantity + safeQty) }
    })
    return cartId
  }

  await prisma.cartItem.create({ data: { cartId, variantId, quantity: safeQty } })
  return cartId
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) throw new Error('No cart found')

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId } })
  if (!item) throw new Error('Cart item not found')

  const safeQty = Math.trunc(quantity)
  if (Number.isNaN(safeQty) || safeQty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } })
    return
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: Math.min(99, safeQty) }
  })
}

export async function removeCartItem(itemId: string) {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) throw new Error('No cart found')

  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } })
}

export async function getCartWithItems() {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) return null

  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        },
        orderBy: { id: 'asc' }
      }
    }
  })
}

export async function clearCurrentCart() {
  const store = cookies()
  const cartId = store.get(CART_COOKIE)?.value

  if (cartId) {
    await prisma.cart.delete({ where: { id: cartId } }).catch(async () => {
      await prisma.cartItem.deleteMany({ where: { cartId } })
    })
  }

  if (typeof (store as any).delete === 'function') {
    ;(store as any).delete(CART_COOKIE)
  }
}
