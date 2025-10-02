import './globals.css'
import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Manrope } from 'next/font/google'
import { prisma } from '@/lib/db'
import { FlowStepper } from '@/components/flow-stepper'

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
        <header className="border-b border-[#efe6d9] bg-[#f9f6ef]/95 backdrop-blur-xl sticky top-0 z-50">
          <div className="container flex h-[72px] items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold uppercase tracking-[0.35rem] text-[#1f1d1a]">
                Bowel Bro
              </Link>
              <FlowStepper />
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium text-[#544a42]">
              <Link className="rounded-full px-4 py-2 hover:bg-white/70" href="/products">
                Products
              </Link>
              <Link className="relative rounded-full px-4 py-2 hover:bg-white/70" href="/cart">
                Cart
                {cartBadge ? (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0f766e] px-1 text-[10px] font-semibold uppercase tracking-[0.2rem] text-white">
                    {cartBadge}
                  </span>
                ) : null}
              </Link>
              <Link className="btn hidden sm:inline-flex" href="/products">
                Shop tees
              </Link>
            </nav>
          </div>
        </header>
        <main className="container py-10 lg:py-14">{children}</main>
        <footer className="border-t border-[#efe6d9] bg-[#f9f6ef]/70 mt-20 backdrop-blur">
          <div className="container flex flex-col gap-3 py-8 text-sm text-[#6f6258] sm:flex-row sm:items-center sm:justify-between">
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
