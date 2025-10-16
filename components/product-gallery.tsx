'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

export type GalleryImage = {
  url: string
  alt: string
}

type ProductGalleryProps = {
  images: GalleryImage[]
}

const SCROLL_STEP = 102

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const thumbnailTrackRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const activeImage = images[activeIndex]

  const showPrev = () => setActiveIndex((idx) => (idx === 0 ? images.length - 1 : idx - 1))
  const showNext = () => setActiveIndex((idx) => (idx === images.length - 1 ? 0 : idx + 1))

  const updateScrollState = useCallback(() => {
    const container = thumbnailTrackRef.current
    if (!container) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, images.length])

  useEffect(() => {
    const container = thumbnailTrackRef.current
    if (!container) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const handleScroll = () => updateScrollState()
    const handleResize = () => updateScrollState()

    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    updateScrollState()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [images.length, updateScrollState])

  const scrollThumbnails = useCallback((direction: 'left' | 'right') => {
    const container = thumbnailTrackRef.current
    if (!container) return

    const firstItem = container.querySelector<HTMLElement>('.product-thumbnail')
    const itemWidth = firstItem?.getBoundingClientRect().width ?? 0
    const computedStyles = window.getComputedStyle(container)
    const gap = parseFloat(computedStyles.columnGap || computedStyles.gap || '0') || 0
    const baseWidth = itemWidth || Math.max(SCROLL_STEP - gap, 0)
    const scrollAmount = baseWidth + gap || SCROLL_STEP

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
    window.requestAnimationFrame(() => updateScrollState())
  }, [SCROLL_STEP, updateScrollState])

  useEffect(() => {
    const container = thumbnailTrackRef.current
    if (!container) return
    const activeThumb = container.querySelector<HTMLButtonElement>('.product-thumbnail.active')
    if (!activeThumb) return
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    window.requestAnimationFrame(() => updateScrollState())
  }, [activeIndex, updateScrollState])

  if (!images.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-dashed border-[var(--border-light)] bg-[var(--bg-soft)] text-sm text-[var(--text-secondary)]">
        Imagery coming soon
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="product-detail-image-frame product-detail-main-image-container relative overflow-hidden rounded-3xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
        <div className="product-detail-image-container">
          <img
            src={activeImage.url}
            alt={activeImage.alt}
            loading={activeIndex === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
            width={600}
            height={750}
            className="product-detail-image product-detail-main-image"
          />
        </div>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border-light)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--green-dark)] shadow hover:bg-[var(--bg-soft)]"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border-light)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--green-dark)] shadow hover:bg-[var(--bg-soft)]"
            >
              Next
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="product-thumbnail-carousel">
          <button
            type="button"
            className="product-carousel-arrow"
            aria-label="Scroll thumbnails left"
            onClick={() => scrollThumbnails('left')}
            disabled={!canScrollLeft}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15.5 19.5L8.5 12L15.5 4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="product-thumbnail-window">
            <div className="product-thumbnail-track" ref={thumbnailTrackRef}>
              {images.map((image, index) => (
                <button
                  key={image.url + index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={image.alt}
                  aria-current={activeIndex === index ? 'true' : undefined}
                  className={clsx('product-thumbnail', { active: activeIndex === index })}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    width={90}
                    height={90}
                    className="product-thumbnail-image"
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="product-carousel-arrow"
            aria-label="Scroll thumbnails right"
            onClick={() => scrollThumbnails('right')}
            disabled={!canScrollRight}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M8.5 4.5L15.5 12L8.5 19.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  )
}
