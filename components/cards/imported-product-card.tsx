'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Package, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink,
  Plane,
  Ship,
  MapPin
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCurrency } from '@/lib/hooks/use-currency'

interface ImportedProduct {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  compareAtPrice?: number
  inventory: number
  category: string
  categoryId?: string
  images: Array<{
    id: string
    path: string
    alt?: string
  }>
  supplierPrice: number
  supplierCurrency: string
  warehouse: string
  transportMode: string
  weight: number
  importCost: number
  productUrl?: string | null
  supplierPriceMGA: number
  importCostMGA: number
  sellingPriceMGA: number
  createdAt: string
  updatedAt: string
}

interface ImportedProductCardProps {
  product: ImportedProduct
  onView: (productId: string) => void
  onEdit: (productId: string) => void
  onDelete: (productId: string, productName: string) => void
  isActionLoading?: string | null
  formatDisplayPrice: (priceInMGA: number, originalAmount?: number, originalCurrency?: string) => string
  getTransportIcon: (mode: string) => React.ReactNode
  truncateText: (text: string, maxLength: number) => string
}

export function ImportedProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  isActionLoading,
  formatDisplayPrice,
  getTransportIcon,
  truncateText
}: ImportedProductCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* En-tête avec image et nom */}
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                    {truncateText(product.name, 40)}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs sm:text-sm text-gray-500">{product.sku}</p>
                    {product.productUrl && (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Voir sur le site fournisseur"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations principales */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Prix fournisseur</span>
              <span className="text-sm font-medium">
                {product.supplierPrice.toLocaleString('fr-FR')} {product.supplierCurrency === 'EUR' ? '€' : product.supplierCurrency === 'USD' ? '$' : product.supplierCurrency === 'GBP' ? '£' : product.supplierCurrency}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Prix de vente</span>
              <span className="text-sm font-medium text-green-600">
                {formatDisplayPrice(product.sellingPriceMGA, product.price, product.supplierCurrency)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Stock</span>
              <span className="text-sm font-medium">{product.inventory}</span>
            </div>
          </div>

          {/* Transport et entrepôt */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getTransportIcon(product.transportMode)}
              <div className="text-xs">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{product.warehouse}</span>
                </div>
                <div className="text-gray-500">{product.weight}kg</div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
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