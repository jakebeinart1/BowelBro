'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import clsx from 'clsx'

type NavItem = {
  label: string
  href: Route
}

type MainNavProps = {
  cartBadge?: number | null
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Cart', href: '/cart' }
]

export function MainNav({ cartBadge = null }: MainNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="flex items-center gap-1 rounded-full border border-[rgba(82,121,111,0.5)] bg-[rgba(26,77,46,0.75)] px-1 py-1 text-sm font-medium text-[var(--body-text-muted)] shadow-[0_12px_30px_-24px_rgba(0,0,0,0.45)] backdrop-blur">
      {navItems.map((item) => {
        const active = isActive(item.href)
        const baseClasses = 'relative rounded-full px-5 py-2 transition-colors duration-200'
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              baseClasses,
              active
                ? 'bg-gradient-to-r from-[var(--accent-green)] to-[#33c172] text-[var(--white)] shadow-[0_10px_22px_-18px_rgba(0,0,0,0.55)]'
                : 'hover:text-[var(--accent-green)]'
            )}
          >
            {item.label}
            {item.href === '/cart' && cartBadge ? (
              <span className="absolute -right-2 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-semibold uppercase tracking-[0.2rem] text-[var(--charcoal)] shadow-[0_6px_18px_-10px_rgba(0,0,0,0.6)]">
                {cartBadge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
