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
    <nav className="flex items-center gap-1 rounded-full border border-[var(--border-light)] bg-white px-1 py-1 text-sm font-medium text-[var(--green-dark)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
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
                ? 'bg-[var(--green-accent)] text-white shadow-[0_6px_16px_rgba(39,174,96,0.35)]'
                : 'hover:bg-[var(--bg-soft)]'
            )}
          >
            {item.label}
            {item.href === '/cart' && cartBadge ? (
              <span className="absolute -right-2 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-semibold uppercase tracking-[0.2rem] text-[var(--green-dark)] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                {cartBadge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
