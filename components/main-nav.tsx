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
    <nav className="flex items-center gap-1 rounded-full border border-[rgba(61,139,132,0.35)] bg-[rgba(250,250,250,0.9)] px-1 py-1 text-sm font-medium text-[var(--text-muted)] shadow-[0_14px_35px_-26px_rgba(27,25,21,0.5)]">
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
                ? 'bg-gradient-to-r from-[var(--forest)] to-[var(--teal)] text-white shadow-[0_10px_25px_-20px_rgba(52,78,65,0.65)]'
                : 'hover:text-[var(--teal)]'
            )}
          >
            {item.label}
            {item.href === '/cart' && cartBadge ? (
              <span className="absolute -right-2 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--terracotta)] px-1 text-[10px] font-semibold uppercase tracking-[0.2rem] text-white shadow-[0_6px_18px_-10px_rgba(217,133,106,0.8)]">
                {cartBadge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
