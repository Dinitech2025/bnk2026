'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Package, Wrench } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
}

interface HeroSlide {
  id: string;
  title: string;
  description: string | null;
  image: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
}

interface HeroBannerImage {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  order: number;
  isActive: boolean;
}

interface HeroBanner {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  
  // Couleurs de texte
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  
  // Boutons
  primaryButtonText: string;
  primaryButtonLink: string;
  primaryButtonColor: string;
  primaryButtonBg: string;
  
  secondaryButtonText: string;
  secondaryButtonLink: string;
  secondaryButtonColor: string;
  secondaryButtonBg: string;
  secondaryButtonBorder: string;
  
  // Effets
  backgroundBlur: number;
  backgroundOpacity: number;
  backgroundOverlayColor: string;
  
  // Diaporama d'images de fond
  backgroundSlideshowEnabled: boolean;
  backgroundSlideshowDuration: number;
  backgroundSlideshowTransition: string;
  backgroundImages: HeroBannerImage[];
}

interface HeroBannerProps {
  heroBanner: HeroBanner | null;
  heroSlides: HeroSlide[];
  categories: Category[];
}

export default function HeroBanner({ heroBanner, heroSlides, categories }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState(0)

  // Auto-play carrousel des slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(1, heroSlides.length))
    }, 5000)
    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Auto-play diaporama des images de fond
  useEffect(() => {
    if (heroBanner?.backgroundSlideshowEnabled && heroBanner?.backgroundImages?.length > 1) {
      const interval = setInterval(() => {
        setCurrentBackgroundImage(prev => (prev + 1) % heroBanner.backgroundImages.length)
      }, heroBanner.backgroundSlideshowDuration || 5000)
      return () => clearInterval(interval)
    }
  }, [heroBanner?.backgroundSlideshowEnabled, heroBanner?.backgroundImages?.length, heroBanner?.backgroundSlideshowDuration])

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % Math.max(1, heroSlides.length))
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + Math.max(1, heroSlides.length)) % Math.max(1, heroSlides.length))
  }

  return (
    <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Images de fond avec diaporama */}
      {heroBanner?.backgroundSlideshowEnabled && heroBanner?.backgroundImages?.length > 0 ? (
        // Mode diaporama activé
        <div className="absolute inset-0">
          {heroBanner.backgroundImages.map((bgImage, index) => (
            <div
              key={bgImage.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                heroBanner.backgroundSlideshowTransition === 'fade' 
                  ? (index === currentBackgroundImage ? 'opacity-100' : 'opacity-0')
                  : heroBanner.backgroundSlideshowTransition === 'slide'
                  ? (index === currentBackgroundImage 
                      ? 'translate-x-0' 
                      : index < currentBackgroundImage 
                      ? '-translate-x-full' 
                      : 'translate-x-full')
                  : heroBanner.backgroundSlideshowTransition === 'zoom'
                  ? (index === currentBackgroundImage 
                      ? 'scale-100 opacity-100' 
                      : 'scale-110 opacity-0')
                  : 'opacity-100'
              }`}
            >
              <Image 
                src={bgImage.imageUrl}
                alt={bgImage.title || 'Background'}
                fill
                className={`object-cover ${heroBanner.backgroundBlur > 0 ? `blur-[${heroBanner.backgroundBlur}px]` : ''}`}
                priority={index === 0}
              />
            </div>
          ))}
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: `${heroBanner.backgroundOverlayColor}${Math.round((heroBanner.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
            }}
          />
        </div>
      ) : heroBanner?.backgroundImage ? (
        // Mode image simple
        <div className="absolute inset-0">
          <Image 
            src={heroBanner.backgroundImage}
            alt="Background"
            fill
            className={`object-cover ${heroBanner.backgroundBlur > 0 ? `blur-[${heroBanner.backgroundBlur}px]` : ''}`}
            priority
          />
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: `${heroBanner.backgroundOverlayColor}${Math.round((heroBanner.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
            }}
          />
        </div>
      ) : null}
      
      {/* Fallback si pas d'image */}
      {!heroBanner?.backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
      )}
      
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col lg:flex-row items-center justify-between">
        <div className="max-w-lg z-10 text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            <span style={{ color: heroBanner?.titleColor || '#ffffff' }}>
              {heroBanner?.title || 'Bienvenue chez'}
            </span>
            <span 
              className="block"
              style={{ color: heroBanner?.subtitleColor || '#fde047' }}
            >
              {heroBanner?.subtitle || "Boutik'nakà"}
            </span>
          </h1>
          <p 
            className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-8 opacity-95 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            style={{ color: heroBanner?.descriptionColor || '#ffffff' }}
          >
            {heroBanner?.description || 'Découvrez nos produits et services de qualité exceptionnelle'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
            <Button 
              size="lg" 
              className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto shadow-lg hover:shadow-xl transition-all border-0"
              style={{
                backgroundColor: heroBanner?.primaryButtonBg || '#3b82f6',
                color: heroBanner?.primaryButtonColor || '#ffffff'
              }}
              asChild
            >
              <Link href={heroBanner?.primaryButtonLink || '/products'}>
                <Package className="mr-2 h-4 w-4" />
                {heroBanner?.primaryButtonText || 'Explorer nos Produits'}
              </Link>
            </Button>
            <Button 
              size="lg" 
              className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto shadow-lg hover:shadow-xl transition-all border-2 hover:opacity-80"
              style={{
                backgroundColor: heroBanner?.secondaryButtonBg || 'transparent',
                color: heroBanner?.secondaryButtonColor || '#ffffff',
                borderColor: heroBanner?.secondaryButtonBorder || '#ffffff'
              }}
              asChild
            >
              <Link href={heroBanner?.secondaryButtonLink || '/services'}>
                <Wrench className="mr-2 h-4 w-4" />
                {heroBanner?.secondaryButtonText || 'Découvrir nos Services'}
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Carrousel des slides configurables */}
        {heroSlides.length > 0 ? (
          <div className="hidden lg:block relative z-10 mt-8 lg:mt-0">
            <div className="w-[700px] h-[400px] xl:w-[800px] xl:h-[400px] relative overflow-hidden rounded-2xl shadow-2xl border-4 border-white/20">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide ? 'translate-x-0 opacity-100' : 
                    index < currentSlide ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                    <div className="p-6 xl:p-8 text-white w-full">
                      <h3 className="text-xl xl:text-2xl font-bold mb-2 xl:mb-3">{slide.title}</h3>
                      {slide.description && (
                        <p className="text-sm xl:text-lg opacity-90 leading-relaxed line-clamp-2">{slide.description}</p>
                      )}
                      <Button variant="secondary" className="mt-3 xl:mt-4 text-sm" asChild>
                        <Link href={slide.buttonLink}>
                          {slide.buttonText}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-6 xl:-left-8">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full w-10 h-10 xl:w-14 xl:h-14 p-0 shadow-xl bg-white/90 hover:bg-white text-primary"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5 xl:h-7 xl:w-7" />
              </Button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-6 xl:-right-8">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full w-10 h-10 xl:w-14 xl:h-14 p-0 shadow-xl bg-white/90 hover:bg-white text-primary"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5 xl:h-7 xl:w-7" />
              </Button>
            </div>
            
            {/* Indicateurs */}
            <div className="absolute -bottom-10 xl:-bottom-14 left-1/2 -translate-x-1/2 flex space-x-3 xl:space-x-4">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 xl:w-4 xl:h-4 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        ) : null}
        
        {/* Indicateurs du diaporama d'images de fond */}
        {heroBanner?.backgroundSlideshowEnabled && heroBanner?.backgroundImages?.length > 1 && (
          <div className="absolute bottom-4 left-4 z-20 flex space-x-2">
            {heroBanner.backgroundImages.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentBackgroundImage 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                onClick={() => setCurrentBackgroundImage(index)}
                aria-label={`Image de fond ${index + 1}`}
              />
            ))}
            <div className="ml-2 px-2 py-1 bg-black/30 rounded text-white text-xs">
              {currentBackgroundImage + 1}/{heroBanner.backgroundImages.length}
            </div>
          </div>
        )}
        
        {/* Mini carrousel pour tablettes */}
        {categories.length > 0 && (
          <div className="hidden lg:block xl:hidden relative z-10 mt-6">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {categories.slice(0, 3).map((category) => (
                <Link 
                  key={category.id} 
                  href={`/categories/${category.id}`}
                  className="flex-shrink-0 w-32 h-20 relative overflow-hidden rounded-lg shadow-lg border-2 border-white/20 hover:scale-105 transition-transform"
                >
                  <Image
                    src={category.image || '/placeholder-image.svg'}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold text-center px-2">{category.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Formes décoratives */}
      <div className="absolute top-5 right-5 md:top-10 md:right-10 w-16 h-16 md:w-32 md:h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 left-5 md:bottom-20 md:left-10 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full blur-lg"></div>
      <div className="absolute top-1/2 left-1/4 w-8 h-8 md:w-16 md:h-16 bg-yellow-300/30 rounded-full blur-md"></div>
    </section>
  )
}
