export default function SuccessPage() {
  return (
    <section className="mx-auto max-w-xl">
      <div className="card grid gap-4 bg-white/85 text-center">
        <h1 className="text-3xl font-semibold text-[#1f1d1a]">Thanks for your order 🎉</h1>
        <p className="text-sm leading-relaxed text-[#544a42]">
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
