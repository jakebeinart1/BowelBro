export default function HomePage() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
      <div className="card bg-white/90 shadow-[0_30px_60px_-40px_rgba(32,24,16,0.65)]">
        <span className="inline-flex items-center rounded-full bg-[#f1e8da] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3rem] text-[#5c4f45]">
          Bowel Bros unite
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-[#1f1d1a] sm:text-5xl">
          Everyone is a <span className="text-[#0f766e]">BOWEL BRO.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#534941]">
          Every single dollar of profit goes straight to IBD research and patient support—this shop is for awareness, not income. Gear up, laugh loud, and love someone&apos;s gut today.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn" href="/products">
            Browse the collection
          </a>
        </div>
        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.25rem] text-[#8a7b70]">Profits</dt>
            <dd className="mt-2 text-2xl font-semibold text-[#1f1d1a]">100% donated</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25rem] text-[#8a7b70]">Comfort</dt>
            <dd className="mt-2 text-2xl font-semibold text-[#1f1d1a]">Butter-soft fabric</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25rem] text-[#8a7b70]">Impact</dt>
            <dd className="mt-2 text-2xl font-semibold text-[#1f1d1a]">Every order fuels IBD awareness</dd>
          </div>
        </dl>
      </div>
      <div className="relative hidden lg:block">
        <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-[#0f766e]/20 blur-2xl" />
        <div className="card relative h-full min-h-[380px] overflow-hidden bg-gradient-to-br from-white via-[#f7f3ed] to-[#f0efe9]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_60%)]" />
          <div className="relative flex h-full flex-col justify-between p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35rem] text-[#8a7b70]">IBD Awareness</p>
              <p className="mt-3 max-w-xs text-base text-[#544a42]">
                From playful slogans to bold statements, every design reminds the world to care for our insides.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-sm text-[#544a42]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
                Sustainably printed on demand by Printful.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#d97706]" />
                Packed and shipped within 3-5 days worldwide.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#334155]" />
                Proceeds fuel IBD research and patient support.
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="impact" className="lg:col-span-2">
        <div className="grid gap-6 rounded-3xl border border-[#efe6d9] bg-white/60 p-8 shadow-[0_30px_60px_-45px_rgba(32,24,16,0.5)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-[#1f1d1a]">Why we do what we do</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl bg-[#f9f6ef] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#8a7b70]">Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#544a42]">
                100% of profits are donated to organizations advancing inflammatory bowel disease research and patient care.
              </p>
            </article>
            <article className="rounded-2xl bg-[#f3f8f6] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#5a7f76]">Community</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#3e5f58]">
                We’re building a loud, proud crew who celebrate gutsy stories and normalise digestive health conversations.
              </p>
            </article>
            <article className="rounded-2xl bg-[#f7f1fb] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#6d5a8f]">Awareness</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#514169]">
                Bold designs spark conversations—because taboos disappear when we share what life with IBD looks like.
              </p>
            </article>
          </div>
        </div>
      </section>
    </section>
  )
}
