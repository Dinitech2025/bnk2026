'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ExternalLink, 
  Star, 
  ShoppingBag, 
  Euro,
  TrendingUp,
  Clock,
  CheckCheck
} from 'lucide-react'
import Link from 'next/link'

interface QuoteData {
  id: string
  status: string
  negotiationType: string
  proposedPrice?: number
  finalPrice?: number
  budget?: number
  description: string
  service?: {
    id: string
    name: string
    slug: string
    price?: number
    images?: Array<{ path: string; alt?: string }>
  }
  product?: {
    id: string
    name: string
    slug: string
    price?: number
    images?: Array<{ path: string; alt?: string }>
  }
  user?: {
    id: string
    name?: string
    email: string
  }
}

interface EnhancedQuoteMessageCardProps {
  quote: QuoteData
  sentAt: string
  compact?: boolean
}

export function EnhancedQuoteMessageCard({ 
  quote, 
  sentAt,
  compact = false 
}: EnhancedQuoteMessageCardProps) {
  const item = quote.service || quote.product
  const itemType = quote.service ? 'service' : 'product'
  const itemName = item?.name || 'Article'
  const basePrice = item?.price || 0

  // Obtenir l'image du produit/service
  const getItemImage = () => {
    if (item?.images && item.images.length > 0) {
      return item.images[0].path
    }
    return null
  }

  // Obtenir l'URL de l'article
  const getItemUrl = () => {
    if (quote.service) {
      return `/services/${quote.service.slug}`
    } else if (quote.product) {
      return `/products/${quote.product.slug}`
    }
    return '#'
  }

  // Traduire les statuts
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'PENDING': 'En attente',
      'NEGOTIATING': 'En négociation',
      'ACCEPTED': 'Accepté',
      'REJECTED': 'Refusé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'PRICE_PROPOSED': 'Prix proposé',
      'QUOTE_REQUESTED': 'Devis demandé'
    }
    return translations[status] || status
  }

  // Traduire les types de négociation
  const translateNegotiationType = (type: string) => {
    const translations: { [key: string]: string } = {
      'SERVICE': 'Service',
      'PRODUCT_PRICE': 'Prix produit',
      'PRODUCT_QUOTE': 'Devis produit'
    }
    return translations[type] || type
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return `Il y a ${days} jours`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%]">
        <div className="flex items-start gap-3">
          {/* Avatar client */}
          <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
            <AvatarFallback className="text-xs font-medium bg-slate-200 text-slate-600">
              {quote.user?.name?.[0] || quote.user?.email?.[0]?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
          
          {/* Carte enrichie */}
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4">
              {/* En-tête avec type et statut */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {itemType === 'service' ? (
                    <Star className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ShoppingBag className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    {translateNegotiationType(quote.negotiationType)}
                  </span>
                </div>
                <Badge 
                  variant={quote.status === 'ACCEPTED' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {translateStatus(quote.status)}
                </Badge>
              </div>

              {/* Informations de l'article */}
              <div className="flex gap-3 mb-3">
                {/* Image de l'article */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {getItemImage() ? (
                      <img
                        src={getItemImage()!}
                        alt={itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-400">
                        {itemType === 'service' ? (
                          <Star className="h-6 w-6" />
                        ) : (
                          <ShoppingBag className="h-6 w-6" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails de l'article */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate mb-1">
                    {itemName}
                  </h4>
                  
                  {/* Prix */}
                  <div className="space-y-1">
                    {basePrice > 0 && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Euro className="h-3 w-3" />
                        <span>Prix de base: {basePrice.toLocaleString()} Ar</span>
                      </div>
                    )}
                    
                    {quote.proposedPrice && (
                      <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                        <TrendingUp className="h-3 w-3" />
                        <span>Prix proposé: {quote.proposedPrice.toLocaleString()} Ar</span>
                      </div>
                    )}
                    
                    {quote.budget && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Euro className="h-3 w-3" />
                        <span>Budget: {quote.budget.toLocaleString()} Ar</span>
                      </div>
                    )}
                    
                    {quote.finalPrice && (
                      <div className="flex items-center gap-1 text-sm text-green-700 font-semibold">
                        <CheckCheck className="h-3 w-3" />
                        <span>Prix final: {quote.finalPrice.toLocaleString()} Ar</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description de la demande */}
              {quote.description && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {quote.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link 
                  href={getItemUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir l'article
                  </Button>
                </Link>
                
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(sentAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
