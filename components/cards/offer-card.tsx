'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Pencil, 
  Tag,
  Clock,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
import { PriceDisplay } from '@/components/ui/price-display'
import Image from 'next/image'

interface Platform {
  id: string
  name: string
  logo: string | null
}

interface PlatformConfig {
  id: string
  platformId: string
  profileCount: number
  isDefault: boolean
  platform?: Platform
}

interface Offer {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  durationUnit: string
  isActive: boolean
  images: string[]
  platformConfigs: PlatformConfig[]
  createdAt: Date
  updatedAt: Date
}

interface OfferCardProps {
  offer: Offer
  onDelete: (id: string) => void
  isActionLoading: string | null
}

export function OfferCard({ offer, onDelete, isActionLoading }: OfferCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* En-tête avec image et nom */}
      <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <div className="relative w-12 h-9 sm:w-16 sm:h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {offer.images && offer.images.length > 0 ? (
            <Image
              src={offer.images[0]}
              alt={offer.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-xs font-medium text-gray-600">
              {offer.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{offer.name}</h3>
          {offer.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">
              {offer.description}
            </p>
          )}
        </div>
        <Badge variant={offer.isActive ? 'success' : 'secondary'} className="text-xs">
          {offer.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Informations principales */}
      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            <span className="text-xs sm:text-sm text-gray-500">Prix :</span>
          </div>
          <PriceDisplay price={offer.price} size="small" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <span className="text-xs sm:text-sm text-gray-500">Durée :</span>
          </div>
          <span className="text-xs sm:text-sm font-medium">{formatDuration(offer.duration, offer.durationUnit)}</span>
        </div>
      </div>

      {/* Plateformes */}
      <div className="mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
          Plateformes ({offer.platformConfigs.length}) :
        </div>
        <div className="flex flex-wrap gap-1">
          {offer.platformConfigs.slice(0, 3).map(config => (
            <Badge
              key={config.id}
              variant={config.isDefault ? "default" : "secondary"}
              className="text-xs"
            >
              {config.platform?.name || 'Plateforme'} ({config.profileCount})
            </Badge>
          ))}
          {offer.platformConfigs.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{offer.platformConfigs.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-1 sm:space-x-2 border-t border-gray-100 pt-2 sm:pt-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-gray-100 h-7 w-7 p-0 sm:h-8 sm:w-8"
          title="Voir les détails"
        >
          <Link href={`/admin/streaming/offers/${offer.id}`}>
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-gray-100 h-7 w-7 p-0 sm:h-8 sm:w-8"
          title="Modifier"
        >
          <Link href={`/admin/streaming/offers/${offer.id}/edit`}>
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(offer.id)}
          className="hover:bg-gray-100 text-red-600 hover:text-red-700 h-7 w-7 p-0 sm:h-8 sm:w-8"
          disabled={isActionLoading === offer.id}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  )
} 