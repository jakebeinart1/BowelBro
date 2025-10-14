import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const brandGreen = '#1a4d2e'
const sage = '#d4ebe5'
const accent = '#27ae60'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          background: `linear-gradient(140deg, ${brandGreen}, #0b2f20)`,
          color: '#fff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background: `radial-gradient(circle at 20% 20%, ${accent}33, transparent 55%)`
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '760px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '999px',
              padding: '12px 24px',
              fontSize: '20px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              backgroundColor: '#ffffff22',
              border: '1px solid rgba(255,255,255,0.35)'
            }}
          >
            Bowel Bro
          </span>

          <h1 style={{ fontSize: '72px', lineHeight: 1.05, fontWeight: 700, margin: 0 }}>
            Support IBD Research
          </h1>

          <p style={{ fontSize: '28px', lineHeight: 1.4, color: sage, margin: 0 }}>
            100% of profits from every tee fund life-changing inflammatory bowel disease research and patient care.
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '22px', color: '#f4f9f6' }}>
            <span>Wear the mission.</span>
            <span>Share the story.</span>
            <span>Fuel the cure.</span>
          </div>

          <div
            style={{
              fontSize: '24px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              padding: '16px 28px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.4)',
              backgroundColor: '#ffffff1a'
            }}
          >
            bowelbro.shop
          </div>
        </div>
      </div>
    ),
    size
  )
}
