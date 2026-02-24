'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ChevronLeft, ChevronRight, Eye, ShoppingCart, Heart, Wrench, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface ProductImage {
  url: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  published: boolean;
  pricingType: 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED';
  minPrice?: number;
  maxPrice?: number;
  requiresQuote: boolean;
  autoAcceptNegotiation: boolean;
  images: ProductImage[];
  category?: {
    id: string;
    name: string;
  };
}

interface ServicesSectionProps {
  services: Service[];
  favorites: string[];
  onAddToCart: (service: Service) => void;
  onToggleFavorite: (serviceId: string) => void;
}

export default function ServicesSection({ 
  services, 
  favorites, 
  onAddToCart, 
  onToggleFavorite 
}: ServicesSectionProps) {
  const [serviceSlide, setServiceSlide] = useState(0)

  const nextSlide = () => {
    setServiceSlide(prev => (prev + 4) % Math.max(4, services.length))
  }

  const prevSlide = () => {
    setServiceSlide(prev => (prev - 4 + Math.max(4, services.length)) % Math.max(4, services.length))
  }

  if (services.length === 0) return null

  return (
    <section className="relative overflow-hidden">
      {/* Fond décoratif bleu premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-25 to-cyan-50 rounded-2xl shadow-inner"></div>
      
      {/* Couche de texture mesh bleue */}
      <div className="absolute inset-0 opacity-25">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/12 via-transparent to-cyan-100/12"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-100/8 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 to-transparent"></div>
      </div>
      
      {/* Motifs géométriques décoratifs bleus */}
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tl from-cyan-200/50 to-sky-200/50 rounded-full blur-2xl opacity-40"></div>
      <div className="absolute top-1/3 right-12 w-16 h-16 bg-blue-100/30 rounded-full blur-xl opacity-25"></div>
      <div className="absolute bottom-1/3 left-1/4 w-12 h-12 bg-cyan-100/40 rounded-full blur-lg opacity-30"></div>
      <div className="absolute top-1/6 left-8 w-10 h-10 bg-sky-200/30 rounded-full blur-lg opacity-25 animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Motifs en vagues subtiles */}
      <div className="absolute top-1/4 left-0 w-32 h-1 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent opacity-40"></div>
      <div className="absolute bottom-1/4 right-0 w-24 h-1 bg-gradient-to-l from-transparent via-cyan-200/15 to-transparent opacity-30"></div>
      <div className="absolute top-3/4 left-1/3 w-16 h-1 bg-gradient-to-r from-sky-200/10 to-transparent opacity-25"></div>
      
      {/* Pattern de points décoratifs bleus */}
      <div className="absolute top-12 right-1/4 w-1 h-1 bg-blue-400/50 rounded-full"></div>
      <div className="absolute top-16 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full"></div>
      <div className="absolute top-20 right-1/4 w-1 h-1 bg-sky-400/45 rounded-full"></div>
      <div className="absolute bottom-12 left-1/5 w-1 h-1 bg-blue-400/50 rounded-full"></div>
      <div className="absolute bottom-16 left-1/5 w-1 h-1 bg-cyan-400/40 rounded-full"></div>
      
      {/* Lignes décoratives multiples bleues */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/20 to-transparent"></div>
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-200/15 to-transparent"></div>
      <div className="absolute top-0 left-3/5 w-px h-2/3 bg-gradient-to-b from-sky-200/12 to-transparent"></div>
      
      <div className="relative flex items-center justify-between mb-6 pt-6 px-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Services Populaires
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="default" size="sm" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full text-white text-sm" asChild>
            <Link href="/services">
              Voir tout
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="relative px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {services.slice(serviceSlide, serviceSlide + 5).map((service) => (
          <Card key={service.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
            <CardHeader className="p-0 relative">
              <Link href={`/services/${service.id}`}>
                <div className="relative w-full aspect-square overflow-hidden">
                  <Image
                    src={service.images?.[0]?.url || '/placeholder-image.svg'}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Boutons overlay - Plus compacts */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
                        asChild
                      >
                        <Link href={`/services/${service.id}`}>
                          <Eye className="h-3 w-3 text-gray-700" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          onAddToCart(service)
                        }}
                        className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                      >
                        {service.pricingType === 'QUOTE_REQUIRED' ? (
                          <MessageSquare className="h-3 w-3" />
                        ) : (
                          <ShoppingCart className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.preventDefault()
                          onToggleFavorite(service.id)
                        }}
                        className={`h-8 w-8 p-0 shadow-lg border-0 rounded-full transition-all ${
                          favorites.includes(service.id) 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white/95 hover:bg-white text-gray-700'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${favorites.includes(service.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </CardHeader>
            <CardContent className="p-2 flex flex-col flex-grow">
              {/* Badge de catégorie */}
              <div className="mb-1">
                <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800 border-cyan-200 font-medium">
                  {service.category?.name || 'Service'}
                </Badge>
              </div>
              
              {/* Indicateur de service */}
              <div className="mb-1">
                <div className="flex items-center text-cyan-600 text-xs font-medium">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1"></div>
                  Disponible
                </div>
              </div>
              
              {/* Nom du service */}
              <Link href={`/services/${service.id}`}>
                <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight text-gray-900">
                  {service.name}
                </h3>
              </Link>
              
              {/* Prix */}
              <div className="mt-auto">
                {service.pricingType === 'QUOTE_REQUIRED' ? (
                  <span className="text-sm font-semibold text-orange-600">
                    Sur devis
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-cyan-600">
                    <PriceWithConversion price={Number(service.price)} />
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
