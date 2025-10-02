'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import clsx from 'clsx'

const steps: Array<{ label: string; href: Route }> = [
  { label: 'Products', href: '/products' },
  { label: 'Cart', href: '/cart' }
]

export function FlowStepper() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Shopping flow"
      className="hidden items-center gap-1 rounded-full bg-[#f1e8da] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.25rem] text-[#6b5d53] sm:flex"
    >
      {steps.map((step, index) => {
        const active = pathname === step.href || pathname.startsWith(`${step.href}/`)
        return (
          <Link
            key={step.href}
            href={step.href}
            className={clsx(
              'rounded-full px-3 py-1 transition-colors duration-200',
              active ? 'bg-white text-[#0f766e] shadow-sm' : 'hover:text-[#0f766e]'
            )}
          >
            {index + 1}. {step.label}
          </Link>
        )
      })}
    </nav>
  )
}
