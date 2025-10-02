export default function HomePage() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
      <div className="card bg-white/90 shadow-[0_30px_60px_-40px_rgba(32,24,16,0.65)]">
        <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#1f1d1a] sm:text-5xl">
          Everyone is a <span className="text-[#0f766e]">BOWEL BRO.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#534941]">
          Every single dollar of profit goes straight to IBD research and patient support—this shop is for awareness, not income. Help save a fellow bowel, bro.
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
        <div className="card relative h-full min-h-[380px] overflow-hidden bg-[#f0f1f3]">
          <div className="relative flex h-full flex-col justify-between gap-6 p-8 text-[#3d3e42]">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35rem] text-[#6d7078]">IBD Awareness</p>
              <p className="max-w-xs text-base text-[#3d3e42]">
                From playful slogans to bold statements, every design reminds the world to care for our insides.
              </p>
              <div className="h-px w-full bg-[#d7d9dd]" />
            </div>
            <div className="flex flex-col gap-4 text-sm text-[#3d3e42]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#6b7280]" />
                Sustainably printed on demand by Printful.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#9ca3af]" />
                Packed and shipped within 3-5 days worldwide.
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#4b5563]" />
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
