'use client'

import { useState } from 'react'
import { ProductImageSlider } from './product-image-slider'
import { ProductPricingSelector } from './product-pricing-selector'
import { ProductAuction } from './product-auction'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  Share2, 
  Package, 
  Truck, 
  Shield, 
  Clock,
  Tag,
  Ruler,
  Weight,
  Barcode,
  Calendar,
  User,
  MapPin
} from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/price-with-conversion'

interface ProductImage {
  id: string
  path: string
  alt?: string
}

interface ProductCategory {
  id: string
  name: string
}

interface ProductAttribute {
  id: string
  name: string
  value: string
}

interface ProductVariation {
  id: string
  sku?: string
  price: number
  inventory: number
  attributes: ProductAttribute[]
  images: ProductImage[]
}

interface ProductDetailCompleteProps {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    compareAtPrice?: number | null
    inventory: number
    sku: string
    barcode?: string | null
    weight?: number | null
    dimensions?: string | null
    featured: boolean
    published: boolean
    createdAt: Date | string
    updatedAt: Date | string
    images: ProductImage[]
    category: ProductCategory
    attributes: ProductAttribute[]
    variations: ProductVariation[]
    // Champs de tarification flexible
    pricingType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED' | 'AUCTION'
    minPrice?: number | null
    maxPrice?: number | null
    requiresQuote?: boolean
    autoAcceptNegotiation?: boolean
    // Champs d'enchère
    auctionEndDate?: Date | string | null
    minimumBid?: number | null
    currentHighestBid?: number | null
  }
  onAddToCart?: (quantity: number) => void
  onToggleFavorite?: () => void
  onPlaceBid?: (amount: number, message?: string) => Promise<void>
  isFavorite?: boolean
  isLoading?: boolean
}

export function ProductDetailComplete({
  product,
  onAddToCart,
  onToggleFavorite,
  onPlaceBid,
  isFavorite = false,
  isLoading = false
}: ProductDetailCompleteProps) {
  
  const handleDefaultPlaceBid = async () => {
    return Promise.resolve()
  }
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)

  // Calculer le stock total
  const totalStock = selectedVariation 
    ? selectedVariation.inventory 
    : product.variations.length > 0 
      ? product.variations.reduce((sum, v) => sum + v.inventory, 0)
      : product.inventory

  // Prix à afficher
  const displayPrice = selectedVariation ? selectedVariation.price : product.price

  // Images à afficher
  const displayImages = selectedVariation && selectedVariation.images.length > 0 
    ? selectedVariation.images 
    : product.images

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || `Découvrez ${product.name}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Erreur de partage:', error)
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Galerie d'images */}
        <div>
          <ProductImageSlider
            images={displayImages}
            productName={product.name}
            showThumbnails={true}
            showZoom={true}
            showFavorite={true}
            onFavoriteToggle={onToggleFavorite}
            isFavorite={isFavorite}
          />
        </div>

        {/* Informations produit */}
        <div className="space-y-6">
          {/* En-tête */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{product.category.name}</Badge>
              {product.featured && (
                <Badge variant="default" className="bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Vedette
                </Badge>
              )}
              {totalStock <= 5 && totalStock > 0 && (
                <Badge variant="destructive">Stock faible</Badge>
              )}
              {totalStock === 0 && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Rupture de stock
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            
            <div className="flex items-center justify-between">
              {/* Prix principal */}
              {product.pricingType === 'QUOTE_REQUIRED' ? (
                <div className="text-2xl font-bold text-purple-600">
                  Prix sur devis uniquement
                </div>
              ) : product.pricingType === 'AUCTION' ? (
                <div className="text-2xl font-bold text-orange-600">
                  Enchère en cours
                </div>
              ) : product.pricingType === 'RANGE' && product.minPrice && product.maxPrice ? (
                <div className="text-2xl font-bold text-blue-600">
                  {product.minPrice.toLocaleString()} - {product.maxPrice.toLocaleString()} Ar
                </div>
              ) : product.pricingType === 'NEGOTIABLE' ? (
                <div className="text-3xl font-bold text-primary flex items-center gap-2">
                  <PriceWithConversion price={displayPrice} />
                  <Badge variant="secondary" className="text-sm">Négociable</Badge>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">
                    <PriceWithConversion price={displayPrice} />
                  </div>
                  {product.compareAtPrice && product.compareAtPrice > displayPrice && (
                    <div className="text-lg text-muted-foreground line-through">
                      <PriceWithConversion price={product.compareAtPrice} />
                    </div>
                  )}
                </div>
              )}

              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Options d'achat */}
          <div>
            {product.pricingType === 'AUCTION' ? (
              <ProductAuction
                product={{
                  id: product.id,
                  name: product.name,
                  currentHighestBid: product.currentHighestBid,
                  minimumBid: product.minimumBid,
                  auctionEndDate: product.auctionEndDate
                }}
                onPlaceBid={onPlaceBid || handleDefaultPlaceBid}
                loading={isLoading}
              />
            ) : (
              <ProductPricingSelector
                product={{
                  id: product.id,
                  name: product.name,
                  price: displayPrice,
                  stock: totalStock,
                  pricingType: product.pricingType || 'FIXED',
                  minPrice: product.minPrice,
                  maxPrice: product.maxPrice,
                  requiresQuote: product.requiresQuote,
                  autoAcceptNegotiation: product.autoAcceptNegotiation
                }}
                onAddToCart={onAddToCart}
                hidePrice={true}
              />
            )}
          </div>

          <Separator />

          {/* Informations de livraison */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span>Livraison gratuite à partir de 50 000 Ar</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Garantie 30 jours satisfait ou remboursé</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>Expédition sous 24-48h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de détails */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Spécifications</TabsTrigger>
          <TabsTrigger value="variations">Variations</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {product.description ? (
                <div className="prose max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Aucune description disponible pour ce produit.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.weight && (
                  <div className="flex items-center gap-3">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Poids:</span>
                    <span>{product.weight} kg</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex items-center gap-3">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Dimensions:</span>
                    <span>{product.dimensions}</span>
                  </div>
                )}
                {product.barcode && (
                  <div className="flex items-center gap-3">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Code-barres:</span>
                    <span className="font-mono">{product.barcode}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">SKU:</span>
                  <span className="font-mono">{product.sku}</span>
                </div>
              </div>

              {product.attributes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Attributs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {product.attributes.map((attr) => (
                      <div key={attr.id} className="flex justify-between py-2 border-b">
                        <span className="font-medium">{attr.name}:</span>
                        <span>{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variations" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {product.variations.length > 0 ? (
                <div className="space-y-4">
                  {product.variations.map((variation) => (
                    <div 
                      key={variation.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <div className="font-medium">
                            <PriceWithConversion price={variation.price} />
                          </div>
                          {variation.sku && (
                            <div className="text-sm text-muted-foreground font-mono">
                              SKU: {variation.sku}
                            </div>
                          )}
                        </div>
                        <Badge variant={variation.inventory > 0 ? "default" : "destructive"}>
                          {variation.inventory} en stock
                        </Badge>
                      </div>
                      
                      {variation.attributes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {variation.attributes.map((attr) => (
                            <Badge key={attr.id} variant="outline" className="text-xs">
                              {attr.name}: {attr.value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Ce produit n'a pas de variations.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Informations générales</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Créé le:</span>
                      <span>{new Date(product.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Mis à jour le:</span>
                      <span>{new Date(product.updatedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Stock total:</span>
                      <span>{totalStock} unités</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Type de tarification</h3>
                  <div className="space-y-2 text-sm">
                    <Badge variant="outline" className="text-sm">
                      {product.pricingType === 'FIXED' && 'Prix fixe'}
                      {product.pricingType === 'RANGE' && 'Plage de prix'}
                      {product.pricingType === 'NEGOTIABLE' && 'Prix négociable'}
                      {product.pricingType === 'QUOTE_REQUIRED' && 'Sur devis uniquement'}
                      {product.pricingType === 'AUCTION' && 'Enchère'}
                      {!product.pricingType && 'Prix fixe'}
                    </Badge>
                    
                    {product.pricingType === 'RANGE' && product.minPrice && product.maxPrice && (
                      <div className="text-muted-foreground">
                        Plage: {product.minPrice.toLocaleString()} - {product.maxPrice.toLocaleString()} Ar
                      </div>
                    )}
                    
                    {product.pricingType === 'AUCTION' && (
                      <div className="space-y-1 text-muted-foreground">
                        {product.minimumBid && (
                          <div>Mise minimum: {product.minimumBid.toLocaleString()} Ar</div>
                        )}
                        {product.auctionEndDate && (
                          <div>Fin: {new Date(product.auctionEndDate).toLocaleString('fr-FR')}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
