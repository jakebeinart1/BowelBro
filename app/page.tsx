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
        <div
          className="relative h-full min-h-[420px] overflow-hidden rounded-3xl"
          style={{ background: 'linear-gradient(165deg, #1a4d2e 0%, #0a2f1f 100%)', border: '1px solid rgba(82,121,111,0.4)' }}
        >
          {/* radial glow top */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 10%, rgba(39,174,96,0.28) 0%, transparent 60%)' }} />
          {/* decorative arc */}
          <div
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10"
            style={{ background: 'conic-gradient(from 0deg, #27ae60, #d4af37, #27ae60)' }}
          />

          <div className="relative flex h-full flex-col justify-between gap-8 p-8">
            {/* header */}
            <div className="space-y-4">
              <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3rem]" style={{ background: 'rgba(39,174,96,0.18)', color: '#6ee79e', border: '1px solid rgba(39,174,96,0.3)' }}>
                IBD Awareness
              </span>
              <p className="max-w-[220px] text-lg font-semibold leading-snug text-white">
                Wear it loud. Every stitch funds the fight.
              </p>
              <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.12), transparent)' }} />
            </div>

            {/* stats */}
            <div className="grid gap-3">
              <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: 'rgba(39,174,96,0.2)' }}>🌿</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6ee79e' }}>Printed on demand</p>
                  <p className="text-sm text-white/70">Zero waste, sustainably made</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: 'rgba(82,121,111,0.3)' }}>📦</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#a8c5bb' }}>Ships worldwide</p>
                  <p className="text-sm text-white/70">Ready in 3–5 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: 'rgba(212,175,55,0.18)' }}>💛</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#d4af37' }}>100% donated</p>
                  <p className="text-sm text-white/70">Every cent to IBD research</p>
                </div>
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
