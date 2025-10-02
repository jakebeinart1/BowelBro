export default function HomePage() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
      <div className="card bg-[linear-gradient(135deg,rgba(217,133,106,0.14),rgba(61,139,132,0.12)),rgba(255,255,255,0.92)]">
        <h1 className="mt-2 text-4xl font-semibold leading-tight text-[var(--charcoal)] sm:text-5xl">
          Everyone is a <span className="text-[var(--accent)]">BOWEL BRO.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--text)]/78">
          Every single dollar of profit goes straight to IBD research and patient support—this shop is for awareness, not income. Help save a fellow bowel, bro.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn" href="/products">
            Browse the collection
          </a>
        </div>
        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/65 p-4 shadow-[0_14px_30px_-26px_rgba(27,25,21,0.35)]">
            <dt className="text-xs uppercase tracking-[0.25rem] text-[var(--text-muted)]/85">Profits</dt>
            <dd className="mt-2 text-2xl font-semibold text-[var(--accent)]">100% donated</dd>
          </div>
          <div className="rounded-2xl bg-white/65 p-4 shadow-[0_14px_30px_-26px_rgba(27,25,21,0.35)]">
            <dt className="text-xs uppercase tracking-[0.25rem] text-[var(--text-muted)]/85">Comfort</dt>
            <dd className="mt-2 text-2xl font-semibold text-[var(--charcoal)]">Butter-soft fabric</dd>
          </div>
          <div className="rounded-2xl bg-white/65 p-4 shadow-[0_14px_30px_-26px_rgba(27,25,21,0.35)]">
            <dt className="text-xs uppercase tracking-[0.25rem] text-[var(--text-muted)]/85">Impact</dt>
            <dd className="mt-2 text-2xl font-semibold text-[var(--teal)]">Every order fuels IBD awareness</dd>
          </div>
        </dl>
      </div>
      <div className="relative hidden lg:block">
        <div className="card relative h-full min-h-[380px] overflow-hidden bg-[linear-gradient(140deg,rgba(58,91,80,0.08),rgba(87,82,121,0.12))]
        ">
          <div className="relative flex h-full flex-col justify-between gap-6 p-8 text-[#263036]">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35rem] text-[#5e6280]">IBD Awareness</p>
              <p className="max-w-xs text-base text-[#263036]">
                From playful slogans to bold statements, every design reminds the world to care for our insides.
              </p>
              <div className="h-px w-full bg-[#d7d9dd]" />
            </div>
            <div className="flex flex-col gap-4 text-sm text-[#2f3034]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--forest)]" />
                Sustainably printed on demand by Printful.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--teal)]/75" />
                Packed and shipped within 3-5 days worldwide.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--terracotta)]/80" />
                Proceeds fuel IBD research and patient support.
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="impact" className="lg:col-span-2">
        <div className="grid gap-6 rounded-3xl border border-[rgba(61,139,132,0.25)] bg-[rgba(255,255,255,0.82)] p-8 shadow-[0_30px_65px_-42px_rgba(23,21,18,0.55)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-[var(--accent)]">Why we do what we do</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl bg-[linear-gradient(135deg,rgba(217,133,106,0.12),rgba(255,255,255,0.7))] p-6 shadow-[0_20px_40px_-30px_rgba(27,25,21,0.55)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--text-muted)]">Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text)]/80">
                100% of profits are donated to organizations advancing inflammatory bowel disease research and patient care.
              </p>
            </article>
            <article className="rounded-2xl bg-[linear-gradient(135deg,rgba(58,91,80,0.08),rgba(255,255,255,0.75))] p-6 shadow-[0_20px_40px_-30px_rgba(27,25,21,0.55)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--text-muted)]">Community</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text)]/80">
                We’re building a loud, proud crew who celebrate gutsy stories and normalise digestive health conversations.
              </p>
            </article>
            <article className="rounded-2xl bg-[linear-gradient(135deg,rgba(87,82,121,0.1),rgba(255,255,255,0.75))] p-6 shadow-[0_20px_40px_-30px_rgba(27,25,21,0.55)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--text-muted)]">Awareness</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text)]/80">
                Bold designs spark conversations—because taboos disappear when we share what life with IBD looks like.
              </p>
            </article>
          </div>
        </div>
      </section>
    </section>
  )
}
