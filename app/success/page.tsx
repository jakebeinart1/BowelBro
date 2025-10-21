import { clearCurrentCart } from '@/lib/cart'

export default async function SuccessPage() {
  await clearCurrentCart().catch(() => {})

  return (
    <section className="mx-auto max-w-xl">
      <div className="card surface-elevated grid gap-4 text-center">
        <h1 className="text-3xl font-semibold text-[var(--white)]">Thanks for your order 🎉</h1>
        <p className="text-sm leading-relaxed text-[var(--body-text-muted)]">
          We&apos;ve received your payment and sent the details to Printful. Expect tracking updates in your inbox soon.
        </p>
        <div className="flex justify-center gap-3">
          <a className="btn" href="/products">
            Continue shopping
          </a>
          <a className="btn-secondary" href="/">
            Return home
          </a>
        </div>
      </div>
    </section>
  )
}
