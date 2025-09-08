import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

interface PhotoCarouselProps {
  images: string[]
  alt: string
  className?: string
}

export default function PhotoCarousel({ images, alt, className = '' }: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  )

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onInit(emblaApi)
    onSelect(emblaApi)
    emblaApi.on('reInit', onInit)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onInit, onSelect])

  // CASCADE: Single image fallback - no carousel needed
  if (images.length <= 1) {
    return (
      <img 
        src={images[0]} 
        alt={alt} 
        className={`w-full h-auto rounded-lg ${className}`}
      />
    )
  }

  return (
    <div className={`photo-carousel ${className}`}>
      <div className="embla overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="embla__container flex">
          {images.map((src, index) => (
            <div className="embla__slide flex-shrink-0 flex-grow-0 basis-full" key={index}>
              <img
                src={src}
                alt={`${alt} ${index + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* CASCADE: Dots navigation */}
      <div className="flex justify-center mt-4 gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === selectedIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* CASCADE: Image counter */}
      <div className="text-center mt-2 text-sm text-gray-600">
        {selectedIndex + 1} / {images.length}
      </div>
    </div>
  )
}
