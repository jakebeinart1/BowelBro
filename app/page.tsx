export default function HomePage() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
      <div className="card">
        <span className="badge-premium text-[#0b2a1b]">Bowel Bros Forever</span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--green-dark)] sm:text-5xl">
          Everyone is a <span className="text-[var(--green-accent)]">BOWEL BRO.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
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
          <div className="rounded-2xl border border-[var(--border-light)] bg-[#e1f2e7] p-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--green-dark)]">Profits</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--green-dark)]">100% donated</dd>
          </div>
          <div className="rounded-2xl border border-[var(--border-light)] bg-[#fff4d4] p-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--green-dark)]">Comfort</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--green-dark)]">Butter-soft fabric</dd>
          </div>
          <div className="rounded-2xl border border-[var(--border-light)] bg-[#f3e6d8] p-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <dt className="text-xs uppercase tracking-[0.28rem] text-[var(--green-dark)]">Impact</dt>
            <dd className="mt-3 text-2xl font-semibold text-[var(--green-dark)]">Awareness + research</dd>
          </div>
        </dl>
      </div>

      <div className="relative hidden lg:block">
        <div className="flex h-full min-h-[420px] flex-col justify-between gap-8 rounded-3xl border border-[#e8d5c8] bg-[var(--peach)] p-6 shadow-[var(--shadow-sm)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--green-sage)]">IBD Awareness</p>
            <p className="mt-3 text-xl font-semibold leading-snug text-[var(--green-dark)]">
              Wear it loud.<br />Every stitch funds the fight.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-3 border-l-2 border-[var(--green-accent)] bg-white/60 px-4 py-3 rounded-r-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--green-dark)]">Printed on demand</p>
                <p className="text-sm text-[var(--text-secondary)]">Zero waste, sustainably made</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l-2 border-[var(--green-sage)] bg-white/60 px-4 py-3 rounded-r-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--green-dark)]">Ships worldwide</p>
                <p className="text-sm text-[var(--text-secondary)]">Ready in 3–5 business days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l-2 border-[var(--gold)] bg-white/60 px-4 py-3 rounded-r-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--green-dark)]">100% donated</p>
                <p className="text-sm text-[var(--text-secondary)]">Every cent to IBD research</p>
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
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#145c36]">Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                100% of profits are donated to organizations advancing inflammatory bowel disease research and patient care.
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--green-sage)]">Community</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                We’re building a loud, proud crew who celebrate gutsy stories and normalise digestive health conversations.
              </p>
            </article>
            <article className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#a04a24]">Awareness</h3>
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
