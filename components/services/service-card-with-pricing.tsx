'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ServicePricingSelector, ServicePricingData } from './service-pricing-selector'
import { Clock, Star, Eye } from 'lucide-react'

interface ServiceCardWithPricingProps {
  service: ServicePricingData & {
    slug: string
    description?: string
    images?: Array<{ url: string; alt?: string }>
    category?: { name: string; slug: string }
  }
  onAddToCart?: (serviceId: string, price: number, proposedPrice?: number, message?: string) => Promise<void>
  onRequestQuote?: (serviceId: string, proposedPrice?: number, message?: string) => Promise<void>
  showFullPricing?: boolean
}

export function ServiceCardWithPricing({
  service,
  onAddToCart,
  onRequestQuote,
  showFullPricing = false
}: ServiceCardWithPricingProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async (price: number, proposedPrice?: number, message?: string) => {
    if (!onAddToCart) return
    
    setLoading(true)
    try {
      await onAddToCart(service.id, price, proposedPrice, message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestQuote = async (proposedPrice?: number, message?: string) => {
    if (!onRequestQuote) return
    
    setLoading(true)
    try {
      await onRequestQuote(service.id, proposedPrice, message)
    } finally {
      setLoading(false)
    }
  }

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'FIXED':
        return { label: 'Prix fixe', color: 'bg-blue-100 text-blue-800' }
      case 'NEGOTIABLE':
        return { label: 'Négociable', color: 'bg-green-100 text-green-800' }
      case 'RANGE':
        return { label: 'Plage de prix', color: 'bg-purple-100 text-purple-800' }
      case 'QUOTE_REQUIRED':
        return { label: 'Devis requis', color: 'bg-orange-100 text-orange-800' }
      default:
        return { label: 'Standard', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const pricingType = getPricingTypeLabel(service.pricingType)

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {service.images && service.images.length > 0 ? (
            <Image
              src={service.images[0].url}
              alt={service.images[0].alt || service.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                  <Star className="w-8 h-8" />
                </div>
                <p className="text-sm">Image du service</p>
              </div>
            </div>
          )}
          
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={pricingType.color}>
              {pricingType.label}
            </Badge>
            {service.requiresQuote && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Validation requise
              </Badge>
            )}
          </div>
          
          {/* Bouton de vue détaillée */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/services/${service.slug}`}>
              <Badge variant="secondary" className="hover:bg-white/90">
                <Eye className="w-3 h-3 mr-1" />
                Voir
              </Badge>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Titre et catégorie */}
          <div>
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">
              {service.name}
            </h3>
            
            {service.category && (
              <Link 
                href={`/services/categories/${service.category.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {service.category.name}
              </Link>
            )}
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {service.description}
            </p>
          )}

          {/* Informations de base */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.duration} min
            </div>
          </div>

          {/* Pricing selon le type */}
          {!showFullPricing ? (
            <div className="space-y-3">
              {service.pricingType === 'FIXED' && (
                <div className="text-2xl font-bold text-primary">
                  {service.price}€
                </div>
              )}
              
              {service.pricingType === 'NEGOTIABLE' && (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {service.price}€
                  </div>
                  <div className="text-sm text-green-600">
                    Prix négociable
                  </div>
                </div>
              )}
              
              {service.pricingType === 'RANGE' && (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {service.minPrice}€ - {service.maxPrice}€
                  </div>
                  <div className="text-sm text-purple-600">
                    Selon vos besoins
                  </div>
                </div>
              )}
              
              {service.pricingType === 'QUOTE_REQUIRED' && (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-orange-600">
                    Sur devis
                  </div>
                  <div className="text-sm text-orange-600">
                    Prix personnalisé
                  </div>
                </div>
              )}
              
              {/* Bouton d'action simple */}
              <Link 
                href={`/services/${service.slug}`}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center block"
              >
                Voir les options
              </Link>
            </div>
          ) : (
            <ServicePricingSelector
              service={service}
              quantity={quantity}
              onAddToCart={handleAddToCart}
              onRequestQuote={handleRequestQuote}
              loading={loading}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
} 