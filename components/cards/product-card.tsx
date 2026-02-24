'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Package, 
  Eye, 
  Edit, 
  Trash2, 
  Tag,
  Clock
} from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import Image from 'next/image'

interface ProductImage {
  id: string
  path: string
  alt?: string
}

interface ProductCategory {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  inventory: number
  price: number
  published: boolean
  featured: boolean
  createdAt: string | Date
  updatedAt: string | Date
  category: ProductCategory | null
  images: ProductImage[]
  barcode?: string | null
  compareAtPrice?: number | null
  dimensions?: string | null
  weight?: number | null
  variations: any[]
  attributes: any[]
  totalInventory: number
  hasDiscount: boolean
  discountPercentage: number
}

interface ProductCardProps {
  product: Product
  onView: (productId: string) => void
  onEdit: (productId: string) => void
  onDelete: (productId: string, productName: string) => void
  isActionLoading?: string | null
  truncateText: (text: string, maxLength: number) => string
  formatDate: (date: string | Date) => string
}

export function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  isActionLoading,
  truncateText,
  formatDate
}: ProductCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* En-tête avec image et nom */}
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {product.images && product.images[0] ? (
                <Image 
                  src={product.images[0].path} 
                  alt={product.name}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                    {truncateText(product.name, 40)}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {product.sku || 'Sans référence'}
                    </p>
                    {product.barcode && (
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {product.barcode}
                      </span>
                    )}
                  </div>
                  {product.featured && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      <Tag className="h-3 w-3 mr-1" />
                      Mis en avant
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informations principales */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Prix</span>
              <div className="text-right">
                <div className="text-sm font-medium">
                  <PriceWithConversion price={Number(product.price)} />
                </div>
                {product.compareAtPrice && Number(product.compareAtPrice) > 0 && (
                  <div className="text-xs text-gray-500 line-through">
                    <PriceWithConversion price={Number(product.compareAtPrice)} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Stock total</span>
              <Badge 
                variant={
                  product.totalInventory > 10 ? 'default' :
                  product.totalInventory > 0 ? 'secondary' : 'destructive'
                }
                className="text-xs"
              >
                {product.totalInventory} en stock
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Variations</span>
              <span className="text-xs">
                {product.variations.length > 0 ? 
                  `${product.variations.length} variation(s)` : 
                  'Aucune variation'
                }
              </span>
            </div>
          </div>

          {/* Catégorie et date */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {product.category?.name || 'Sans catégorie'}
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(product.createdAt)}
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={product.published ? 'default' : 'secondary'}
              className="text-xs"
            >
              {product.published ? 'Actif' : 'Inactif'}
            </Badge>
            {(product.dimensions || product.weight) && (
              <div className="text-xs text-gray-500">
                {product.dimensions && <span className="mr-2">{String(product.dimensions)}</span>}
                {product.weight && <span>{Number(product.weight)} kg</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-1 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onView(product.id)}
              title="Voir le produit"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(product.id)}
              title="Modifier le produit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              onClick={() => onDelete(product.id, product.name)}
              title="Supprimer le produit"
              disabled={isActionLoading === product.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 