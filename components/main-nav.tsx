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
    <nav className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/80 px-1 py-1 text-sm font-medium text-[var(--text-muted)] shadow-[0_12px_30px_-28px_rgba(22,20,18,0.55)]">
      {navItems.map((item) => {
        const active = isActive(item.href)
        const baseClasses = 'relative rounded-full px-5 py-2 transition-colors duration-200'
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              baseClasses,
              active ? 'bg-white text-[var(--accent)] shadow-sm' : 'hover:text-[var(--accent)]'
            )}
          >
            {item.label}
            {item.href === '/cart' && cartBadge ? (
              <span className="absolute -right-2 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold uppercase tracking-[0.2rem] text-white">
                {cartBadge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
