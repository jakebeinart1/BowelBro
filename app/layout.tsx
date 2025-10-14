import './globals.css'
import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Manrope } from 'next/font/google'
import { prisma } from '@/lib/db'
import { MainNav } from '@/components/main-nav'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' })

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bowelbro.shop'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Support IBD Research',
  description:
    'Join the Bowel Bro community to fund IBD research and patient support with every tee you share.',
  openGraph: {
    title: 'Support IBD Research',
    description:
      'Wear your advocacy. Every Bowel Bro purchase funds inflammatory bowel disease research and support.',
    siteName: 'Bowel Bro',
    url: '/',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Support IBD Research' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support IBD Research',
    description:
      'Share the mission. 100% of profits fuel inflammatory bowel disease research and patient care.',
    images: ['/opengraph-image']
  }
}

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
        <header className="border-b border-[var(--border-light)] bg-white/90 backdrop-blur sticky top-0 z-50 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
          <div className="container flex h-[72px] items-center justify-between gap-6">
            <Link href="/" className="text-lg font-semibold uppercase tracking-[0.35rem] text-[var(--green-dark)]">
              Bowel Bro
            </Link>
            <MainNav cartBadge={cartBadge} />
          </div>
        </header>
        <main className="container py-12 lg:py-16">{children}</main>
        <footer className="border-t border-[var(--border-light)] bg-white/80 mt-24 shadow-[0_-2px_6px_rgba(0,0,0,0.04)]">
          <div className="container flex flex-col gap-3 py-10 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Bowel Bro · Made with guts.</span>
            <div className="flex gap-4">
              <a className="hover:text-[var(--green-accent)]" href="/products">Shop</a>
              <a className="hover:text-[var(--green-accent)]" href="/cart">Cart</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
