'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Expand, Heart } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ProductImage {
  id?: string
  path?: string
  url?: string
  alt?: string
}

interface ProductImageSliderProps {
  images: ProductImage[]
  productName: string
  className?: string
  showThumbnails?: boolean
  showZoom?: boolean
  showFavorite?: boolean
  onFavoriteToggle?: () => void
  isFavorite?: boolean
}

export function ProductImageSlider({
  images,
  productName,
  className,
  showThumbnails = true,
  showZoom = true,
  showFavorite = false,
  onFavoriteToggle,
  isFavorite = false
}: ProductImageSliderProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showZoomModal, setShowZoomModal] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className={cn("aspect-square bg-muted rounded-lg flex items-center justify-center", className)}>
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
            <Image 
              src="/placeholder-image.jpg" 
              alt="Pas d'image" 
              width={64} 
              height={64}
              className="opacity-50"
            />
          </div>
          <p className="text-sm">Aucune image</p>
        </div>
      </div>
    )
  }

  const currentImage = images[currentImageIndex]
  const getImageUrl = (image: ProductImage) => image.url || image.path || '/placeholder-image.svg'
  const hasMultipleImages = images.length > 1

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    )
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image principale */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
        <Image
          src={getImageUrl(currentImage)}
          alt={currentImage.alt || `${productName} - Image ${currentImageIndex + 1}`}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={currentImageIndex === 0}
        />

        {/* Badge du nombre d'images */}
        {hasMultipleImages && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-black/70 text-white border-0"
          >
            {currentImageIndex + 1} / {images.length}
          </Badge>
        )}

        {/* Bouton favori */}
        {showFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-black/70 hover:bg-black/80 text-white"
            onClick={onFavoriteToggle}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
        )}

        {/* Boutons de navigation */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Bouton zoom */}
        {showZoom && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowZoomModal(true)}
          >
            <Expand className="h-4 w-4" />
          </Button>
        )}

        {/* Indicateurs de navigation (points) */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentImageIndex 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/70"
                )}
                onClick={() => goToImage(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniatures */}
      {showThumbnails && hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                index === currentImageIndex 
                  ? "border-primary" 
                  : "border-transparent hover:border-muted-foreground/50"
              )}
              onClick={() => goToImage(index)}
            >
              <Image
                src={getImageUrl(image)}
                alt={image.alt || `Miniature ${index + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal de zoom */}
      {showZoom && (
        <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
          <DialogContent className="max-w-4xl w-full p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={getImageUrl(currentImage)}
                alt={currentImage.alt || `${productName} - Image agrandie`}
                fill
                className="object-contain"
                sizes="100vw"
              />
              
              {/* Navigation dans le modal */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  <Badge 
                    variant="secondary" 
                    className="absolute top-4 left-4 bg-black/70 text-white border-0"
                  >
                    {currentImageIndex + 1} / {images.length}
                  </Badge>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
