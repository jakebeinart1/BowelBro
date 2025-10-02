import './globals.css'
import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Manrope } from 'next/font/google'
import { prisma } from '@/lib/db'
import { MainNav } from '@/components/main-nav'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = { title: 'Bowel Bro Shop', description: 'Everyone is a BOWEL BRO. Care for a fellow bowel by buying a shirt, spreading awareness, and donating to IBD research.' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cartCookie = cookies().get('cartId')?.value
  let cartCount = 0

  if (cartCookie) {
    const cartAggregate = await prisma.cartItem.aggregate({
      _sum: { quantity: true },
      where: { cartId: cartCookie }
    })
    cartCount = cartAggregate._sum.quantity ?? 0
  }

  const cartBadge = cartCount > 0 ? Math.min(cartCount, 99) : null

  return (
    <html lang="en">
      <body className={`${manrope.className} antialiased`}>
        <header className="border-b border-[var(--border)] bg-[rgba(255,255,255,0.85)] backdrop-blur-xl sticky top-0 z-50 shadow-[0_10px_30px_-24px_rgba(17,16,14,0.45)]">
          <div className="container flex h-[72px] items-center justify-between gap-6">
            <Link href="/" className="text-lg font-semibold uppercase tracking-[0.35rem] text-[var(--accent)]">
              Bowel Bro
            </Link>
            <MainNav cartBadge={cartBadge} />
          </div>
        </header>
        <main className="container py-10 lg:py-14">{children}</main>
        <footer className="border-t border-[var(--border)] bg-[rgba(255,255,255,0.78)] mt-20 backdrop-blur">
          <div className="container flex flex-col gap-3 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Bowel Bro · Made with guts.</span>
            <div className="flex gap-4">
              <a href="/products">Shop</a>
              <a href="/cart">Cart</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
