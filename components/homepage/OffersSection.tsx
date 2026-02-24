'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ChevronLeft, ChevronRight, Eye, ShoppingCart, Heart, Star, Play } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface ProductImage {
  url: string;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  isPopular?: boolean;
}

interface OffersSectionProps {
  offers: Offer[];
  favorites: string[];
  onAddToCart: (offer: Offer) => void;
  onToggleFavorite: (offerId: string) => void;
}

export default function OffersSection({ 
  offers, 
  favorites, 
  onAddToCart, 
  onToggleFavorite 
}: OffersSectionProps) {
  const [offerSlide, setOfferSlide] = useState(0)

  const nextSlide = () => {
    setOfferSlide(prev => (prev + 4) % Math.max(4, offers.length))
  }

  const prevSlide = () => {
    setOfferSlide(prev => (prev - 4 + Math.max(4, offers.length)) % Math.max(4, offers.length))
  }

  if (offers.length === 0) return null

  return (
    <section className="relative overflow-hidden">
      {/* Fond décoratif violet premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-violet-25 to-pink-50 rounded-2xl shadow-inner"></div>
      
      {/* Couche de texture mesh violette ultra sophistiquée */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/15 via-transparent to-pink-100/15"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-100/10 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/12 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-pink-50/8"></div>
      </div>
      
      {/* Motifs géométriques décoratifs violets */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-pink-200/50 to-violet-200/50 rounded-full blur-2xl opacity-40"></div>
      <div className="absolute top-1/4 left-12 w-16 h-16 bg-purple-100/30 rounded-full blur-xl opacity-25"></div>
      <div className="absolute bottom-1/2 right-1/5 w-12 h-12 bg-pink-100/40 rounded-full blur-lg opacity-30"></div>
      <div className="absolute top-3/4 right-12 w-8 h-8 bg-violet-100/35 rounded-full blur-md opacity-35"></div>
      <div className="absolute top-1/6 right-1/4 w-6 h-6 bg-purple-200/25 rounded-full blur-sm opacity-40 animate-pulse" style={{animationDelay: '3s'}}></div>
      
      <div className="relative flex items-center justify-between mb-6 pt-6 px-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <Play className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Abonnements Populaires
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4 text-purple-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4 text-purple-600" />
          </Button>
          <Button variant="destructive" size="sm" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full text-sm" asChild>
            <Link href="/subscriptions">
              Voir tout
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="relative px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {offers.slice(offerSlide, offerSlide + 5).map((offer) => (
            <Card key={offer.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
              <CardHeader className="p-0 relative">
                <Link href={`/subscriptions`}>
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={offer.images?.[0]?.url || '/placeholder-image.svg'}
                      alt={offer.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Badge populaire - Plus compact */}
                    {offer.isPopular && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg text-xs px-2 py-1">
                          <Star className="h-2 w-2 mr-1 fill-current" />
                          Populaire
                        </Badge>
                      </div>
                    )}
                    
                    {/* Boutons overlay - Plus compacts */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
                          asChild
                        >
                          <Link href={`/subscriptions`}>
                            <Eye className="h-3 w-3 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            onAddToCart(offer)
                          }}
                          className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault()
                            onToggleFavorite(offer.id)
                          }}
                          className={`h-8 w-8 p-0 shadow-lg border-0 rounded-full transition-all ${
                            favorites.includes(offer.id) 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-white/95 hover:bg-white text-gray-700'
                          }`}
                        >
                          <Heart className={`h-3 w-3 ${favorites.includes(offer.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-2 flex flex-col flex-grow">
                {/* Badge abonnement */}
                <div className="mb-1">
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200 font-medium">
                    Abonnement
                  </Badge>
                </div>
                
                {/* Indicateur de disponibilité */}
                <div className="mb-1">
                  <div className="flex items-center text-purple-600 text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                    Disponible
                  </div>
                </div>
                
                {/* Nom de l'abonnement */}
                <Link href={`/subscriptions`}>
                  <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight text-gray-900">
                    {offer.name}
                  </h3>
                </Link>
                
                {/* Prix */}
                <div className="mt-auto">
                  <div className="flex flex-col">
                    {offer.originalPrice && offer.originalPrice > offer.price && (
                      <span className="text-xs text-gray-500 line-through">
                        <PriceWithConversion price={Number(offer.originalPrice)} />
                      </span>
                    )}
                    <span className="text-sm font-semibold text-purple-600">
                      <PriceWithConversion price={Number(offer.price)} />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
