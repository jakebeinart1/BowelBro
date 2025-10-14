export default function HomePage() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
      <div className="card">
        <span className="badge-premium text-[var(--green-dark)]">Bowel Bros Forever</span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--green-dark)] sm:text-5xl">
          Everyone is a <span className="text-[var(--accent-green)]">BOWEL BRO.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--body-text-muted)]">
          Every single dollar of profit goes straight to IBD research and patient support—this shop exists to raise awareness, not income. Help save a fellow bowel, bro.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="btn" href="/products">
            Browse the collection
          </a>
          <a className="btn-secondary" href="/cart">
            View cart
          </a>
        </div>
        <dl className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-soft)] p-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--green-dark)]">Profits</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--green-dark)]">100% donated</dd>
          </div>
          <div className="rounded-2xl border border-[var(--border-light)] bg-[#e6ccb2] p-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--green-dark)]">Comfort</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--green-dark)]">Butter-soft fabric</dd>
          </div>
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-soft)] p-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--green-dark)]">Impact</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--green-dark)]">Awareness + research</dd>
          </div>
        </dl>
      </div>

      <div className="relative hidden lg:block">
        <div className="card h-full min-h-[420px] overflow-hidden border-[rgba(82,121,111,0.4)] bg-[linear-gradient(165deg,rgba(26,77,46,0.92),rgba(10,47,31,0.85))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,174,96,0.22),transparent_65%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8 p-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35rem] text-[var(--sage)]">IBD Awareness</p>
          <p className="max-w-xs text-base text-[var(--text-primary)]">
            From playful slogans to bold statements, every design reminds the world to listen to our guts and care for our insides.
          </p>
              <div className="divider-soft" />
            </div>
            <div className="grid gap-4 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--green-accent)]" />
                Sustainably printed on demand by Printful.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--green-sage)]" />
                Packed and shipped within 3-5 days worldwide.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
                Proceeds fuel IBD research and patient support.
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="impact" className="lg:col-span-2">
        <div className="grid gap-6 rounded-3xl border border-[var(--border-light)] bg-[var(--bg-soft)] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <h2 className="text-2xl font-semibold text-[var(--green-dark)]">Why we do what we do</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--green-dark)]">Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                100% of profits are donated to organizations advancing inflammatory bowel disease research and patient care.
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--green-dark)]">Community</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                We’re building a loud, proud crew who celebrate gutsy stories and normalise digestive health conversations.
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--green-dark)]">Awareness</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                Bold designs spark conversations—because taboos disappear when we share what life with IBD looks like.
              </p>
            </article>
          </div>
        </div>
      </section>
    </section>
  )
}
