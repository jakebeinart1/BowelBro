export default function HomePage() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
      <div className="card surface-elevated">
        <span className="badge-premium">Bowel Bros Forever</span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--white)] sm:text-5xl">
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
          <div className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.1)] p-5 shadow-[0_14px_32px_-24px_rgba(0,0,0,0.45)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--gold)]">Profits</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--white)]">100% donated</dd>
          </div>
          <div className="rounded-2xl border border-[rgba(82,121,111,0.45)] bg-[rgba(26,77,46,0.85)] p-5 shadow-[0_14px_32px_-24px_rgba(0,0,0,0.45)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--sage)]">Comfort</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--white)]">Butter-soft fabric</dd>
          </div>
          <div className="rounded-2xl border border-[rgba(39,174,96,0.45)] bg-[rgba(39,174,96,0.18)] p-5 shadow-[0_14px_32px_-24px_rgba(0,0,0,0.45)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--accent-green)]">Impact</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--white)]">Awareness + research</dd>
          </div>
        </dl>
      </div>

      <div className="relative hidden lg:block">
        <div className="card h-full min-h-[420px] overflow-hidden border-[rgba(82,121,111,0.4)] bg-[linear-gradient(165deg,rgba(26,77,46,0.92),rgba(10,47,31,0.85))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,174,96,0.22),transparent_65%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8 p-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35rem] text-[var(--sage)]">IBD Awareness</p>
              <p className="max-w-xs text-base text-[var(--body-text)]">
                From playful slogans to bold statements, every design reminds the world to listen to our guts and care for our insides.
              </p>
              <div className="divider-soft" />
            </div>
            <div className="grid gap-4 text-sm text-[var(--body-text-muted)]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
                Sustainably printed on demand by Printful.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--sage)]" />
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
        <div className="grid gap-6 rounded-3xl border border-[rgba(82,121,111,0.45)] bg-[linear-gradient(165deg,rgba(26,77,46,0.92),rgba(10,47,31,0.9))] p-8 shadow-[0_30px_70px_-42px_rgba(0,0,0,0.6)]">
          <h2 className="text-2xl font-semibold text-[var(--white)]">Why we do what we do</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[linear-gradient(145deg,rgba(212,175,55,0.18),rgba(10,47,31,0.9))] p-6 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.5)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--gold)]">Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--body-text-muted)]">
                100% of profits are donated to organizations advancing inflammatory bowel disease research and patient care.
              </p>
            </article>
            <article className="rounded-2xl border border-[rgba(82,121,111,0.4)] bg-[linear-gradient(145deg,rgba(26,77,46,0.78),rgba(10,47,31,0.92))] p-6 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.5)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--sage)]">Community</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--body-text-muted)]">
                We’re building a loud, proud crew who celebrate gutsy stories and normalise digestive health conversations.
              </p>
            </article>
            <article className="rounded-2xl border border-[rgba(184,115,51,0.4)] bg-[linear-gradient(145deg,rgba(184,115,51,0.2),rgba(10,47,31,0.9))] p-6 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.5)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--copper)]">Awareness</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--body-text-muted)]">
                Bold designs spark conversations—because taboos disappear when we share what life with IBD looks like.
              </p>
            </article>
          </div>
        </div>
      </section>
    </section>
  )
}
