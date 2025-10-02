export default function SuccessPage() {
  return (
    <section className="mx-auto max-w-xl">
      <div className="card grid gap-4 bg-[linear-gradient(135deg,rgba(218,233,245,0.7),rgba(255,255,255,0.9))] text-center">
        <h1 className="text-3xl font-semibold text-[var(--accent)]">Thanks for your order 🎉</h1>
        <p className="text-sm leading-relaxed text-[var(--text)]/80">
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
