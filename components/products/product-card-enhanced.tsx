'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Clock, 
  TrendingUp, 
  MessageSquare,
  DollarSign,
  Hammer
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export type ProductPricingType = 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED' | 'AUCTION'

interface ProductImage {
  url: string
  alt?: string
}

interface Product {
  id: string
  name: string
  slug?: string
  price: number
  compareAtPrice?: number
  inventory: number
  images?: ProductImage[]
  pricingType?: ProductPricingType
  minPrice?: number
  maxPrice?: number
  requiresQuote?: boolean
  auctionEndDate?: string | Date
  currentHighestBid?: number
  minimumBid?: number
}

interface ProductCardEnhancedProps {
  product: Product
  isFavorite?: boolean
  onToggleFavorite?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  compact?: boolean
  showStock?: boolean
}

export function ProductCardEnhanced({
  product,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  compact = false,
  showStock = true
}: ProductCardEnhancedProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const pricingType = product.pricingType || 'FIXED'

  // Calculer le temps restant pour les enchères
  const getTimeRemaining = () => {
    if (!product.auctionEndDate) return null
    const end = new Date(product.auctionEndDate).getTime()
    const now = new Date().getTime()
    const diff = end - now
    
    if (diff <= 0) return 'Terminée'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}j ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }

  // Badge de type de prix
  const getPricingBadge = () => {
    switch (pricingType) {
      case 'RANGE':
        return (
          <Badge className="bg-blue-500 text-white text-xs">
            <DollarSign className="h-3 w-3 mr-1" />
            Plage de prix
          </Badge>
        )
      case 'NEGOTIABLE':
        return (
          <Badge className="bg-yellow-500 text-white text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Négociable
          </Badge>
        )
      case 'QUOTE_REQUIRED':
        return (
          <Badge className="bg-purple-500 text-white text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Sur devis
          </Badge>
        )
      case 'AUCTION':
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs animate-pulse">
            <Hammer className="h-3 w-3 mr-1" />
            Enchère
          </Badge>
        )
      default:
        return null
    }
  }

  // Affichage du prix selon le type
  const renderPrice = () => {
    switch (pricingType) {
      case 'AUCTION':
        return (
          <div className="space-y-1">
            <div className="text-lg font-bold text-orange-600">
              {product.currentHighestBid
                ? `${product.currentHighestBid.toLocaleString()} Ar`
                : `Min: ${(product.minimumBid || 0).toLocaleString()} Ar`}
            </div>
            {product.currentHighestBid && (
              <div className="text-xs text-muted-foreground">
                {product.currentHighestBid > (product.minimumBid || 0) ? 'Offre actuelle' : 'Mise de départ'}
              </div>
            )}
          </div>
        )
      
      case 'RANGE':
        return (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Entre</div>
            <div className="text-lg font-bold">
              {product.minPrice?.toLocaleString()} - {product.maxPrice?.toLocaleString()} Ar
            </div>
          </div>
        )
      
      case 'QUOTE_REQUIRED':
        return (
          <div className="text-lg font-bold text-purple-600">
            Prix sur devis
          </div>
        )
      
      case 'NEGOTIABLE':
        return (
          <div className="space-y-1">
            <div className="text-lg font-bold">
              {product.price.toLocaleString()} Ar
            </div>
            <div className="text-xs text-yellow-600 font-medium">
              Prix négociable
            </div>
          </div>
        )
      
      default: // FIXED
        return (
          <div className="space-y-1">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="text-sm text-muted-foreground line-through">
                {product.compareAtPrice.toLocaleString()} Ar
              </div>
            )}
            <div className="text-lg font-bold">
              {product.price.toLocaleString()} Ar
            </div>
          </div>
        )
    }
  }

  // Bouton d'action selon le type
  const renderActionButton = () => {
    switch (pricingType) {
      case 'AUCTION':
        const timeRemaining = getTimeRemaining()
        return (
          <Link href={`/products/${product.id}`} className="w-full">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" size={compact ? 'sm' : 'default'}>
              <Hammer className="h-4 w-4 mr-2" />
              {timeRemaining === 'Terminée' ? 'Voir résultat' : 'Enchérir'}
            </Button>
          </Link>
        )
      
      case 'QUOTE_REQUIRED':
        return (
          <Link href={`/products/${product.id}`} className="w-full">
            <Button variant="outline" className="w-full border-purple-500 text-purple-600 hover:bg-purple-50" size={compact ? 'sm' : 'default'}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Demander un devis
            </Button>
          </Link>
        )
      
      case 'NEGOTIABLE':
      case 'RANGE':
        return (
          <Link href={`/products/${product.id}`} className="w-full">
            <Button variant="outline" className="w-full" size={compact ? 'sm' : 'default'}>
              <DollarSign className="h-4 w-4 mr-2" />
              Proposer un prix
            </Button>
          </Link>
        )
      
      default: // FIXED
        return product.inventory > 0 ? (
          <Button 
            onClick={() => onAddToCart?.(product.id)}
            className="w-full" 
            size={compact ? 'sm' : 'default'}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ajouter au panier
          </Button>
        ) : (
          <Button disabled className="w-full" size={compact ? 'sm' : 'default'}>
            Rupture de stock
          </Button>
        )
    }
  }

  return (
    <Card className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
      <CardHeader className="p-0 relative">
        <Link href={`/products/${product.id}`}>
          <div className="relative w-full aspect-square overflow-hidden">
            <Image
              src={product.images?.[0]?.url || '/placeholder-image.svg'}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Boutons overlay - Style service */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
                  asChild
                >
                  <Link href={`/products/${product.id}`}>
                    <Eye className="h-3 w-3 text-gray-700" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    if (pricingType === 'FIXED' && product.inventory > 0) {
                      onAddToCart?.(product.id)
                    }
                  }}
                  disabled={pricingType === 'FIXED' && product.inventory <= 0}
                  className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                >
                  {pricingType === 'QUOTE_REQUIRED' || pricingType === 'AUCTION' ? (
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
                    onToggleFavorite?.(product.id)
                  }}
                  className={cn(
                    "h-8 w-8 p-0 shadow-lg border-0 rounded-full transition-all",
                    isFavorite 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/95 hover:bg-white text-gray-700'
                  )}
                >
                  <Heart className={cn("h-3 w-3", isFavorite && "fill-current")} />
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </CardHeader>
      
      <CardContent className="p-2 flex flex-col flex-grow">
        {/* Badge de type de prix */}
        <div className="mb-1">
          {pricingType === 'QUOTE_REQUIRED' ? (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200 font-medium">
              💬 Sur devis
            </Badge>
          ) : pricingType === 'AUCTION' ? (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200 font-medium animate-pulse">
              🔨 Enchère
            </Badge>
          ) : pricingType === 'NEGOTIABLE' ? (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200 font-medium">
              📈 Négociable
            </Badge>
          ) : pricingType === 'RANGE' ? (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200 font-medium">
              💲 Plage de prix
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200 font-medium">
              {product.inventory > 0 ? 'En stock' : 'Sur commande'}
            </Badge>
          )}
        </div>
        
        {/* Indicateur de disponibilité / Timer */}
        <div className="mb-1">
          {pricingType === 'AUCTION' && product.auctionEndDate ? (
            <div className="flex items-center text-orange-600 text-xs font-medium">
              <Clock className="w-3 h-3 mr-1" />
              {getTimeRemaining()}
            </div>
          ) : (
            <div className="flex items-center text-green-600 text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              Disponible
            </div>
          )}
        </div>
        
        {/* Nom du produit */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight text-gray-900">
            {product.name}
          </h3>
        </Link>
        
        {/* Prix */}
        <div className="mt-auto">
          {pricingType === 'QUOTE_REQUIRED' ? (
            <span className="text-sm font-semibold text-purple-600">
              Sur devis
            </span>
          ) : pricingType === 'AUCTION' ? (
            <span className="text-sm font-semibold text-orange-600">
              {product.currentHighestBid
                ? `${product.currentHighestBid.toLocaleString()} Ar`
                : `Min: ${(product.minimumBid || 0).toLocaleString()} Ar`}
            </span>
          ) : pricingType === 'RANGE' && product.minPrice && product.maxPrice ? (
            <span className="text-sm font-semibold text-blue-600">
              {product.minPrice.toLocaleString()}-{product.maxPrice.toLocaleString()} Ar
            </span>
          ) : (
            <span className="text-sm font-semibold text-blue-600">
              {product.price.toLocaleString()} Ar
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

