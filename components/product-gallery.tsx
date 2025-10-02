'use client'

import { useState } from 'react'
import clsx from 'clsx'

export type GalleryImage = {
  url: string
  alt: string
}

type ProductGalleryProps = {
  images: GalleryImage[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]

  const showPrev = () => setActiveIndex((idx) => (idx === 0 ? images.length - 1 : idx - 1))
  const showNext = () => setActiveIndex((idx) => (idx === images.length - 1 ? 0 : idx + 1))

  if (!images.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-white/70 text-sm text-[var(--text-muted)]">
        Imagery coming soon
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white/85 shadow-[0_30px_60px_-45px_rgba(22,20,18,0.55)]">
        <div className="relative aspect-[4/5] w-full">
          <img
            src={activeImage.url}
            alt={activeImage.alt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--text)]/80 shadow hover:bg-white"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--text)]/80 shadow hover:bg-white"
              >
                Next
              </button>
            </>
          ) : null}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={clsx(
                'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition',
                activeIndex === index
                  ? 'border-[var(--accent)] shadow-[0_10px_25px_-18px_rgba(52,78,65,0.55)]'
                  : 'border-transparent hover:border-[var(--border)]'
              )}
            >
              <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
