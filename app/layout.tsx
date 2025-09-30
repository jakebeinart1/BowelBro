import './globals.css'
import React from 'react'
import { Manrope } from 'next/font/google'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = { title: 'Bowel Bro Shop', description: 'Everyone is a BOWEL BRO. Care for a fellow bowel by buying a shirt, spreading awareness, and donating to IBD research.' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <header className="border-b">
          <div className="container flex items-center justify-between h-16">
            <a href="/" className="font-bold tracking-wide uppercase">Bowel Bro</a>
            <nav className="flex gap-4 text-sm">
              <a href="/products">Products</a>
              <a href="/cart">Cart</a>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="border-t mt-16">
          <div className="container py-6 text-sm text-gray-500">© {new Date().getFullYear()} Bowel Bro</div>
        </footer>
      </body>
    </html>
  )
}
