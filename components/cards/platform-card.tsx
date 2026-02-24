'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Globe, 
  Eye, 
  Pencil, 
  Calendar,
  Users,
  Trash2,
  Check,
  X as XIcon
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface PlatformCardProps {
  platform: Platform
  onDelete: (id: string) => void
  isActionLoading: string | null
}

export function PlatformCard({ platform, onDelete, isActionLoading }: PlatformCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* En-tête avec logo et nom */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {platform.logo ? (
              <img 
                src={platform.logo} 
                alt={platform.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Globe className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{platform.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">{platform.slug}</p>
          </div>
        </div>
        
        <Badge variant={platform.isActive ? 'success' : 'secondary'} className="text-xs">
          {platform.isActive ? (
            <Check className="h-3 w-3 mr-1" />
          ) : (
            <XIcon className="h-3 w-3 mr-1" />
          )}
          {platform.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Description */}
      {platform.description && (
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
          {platform.description}
        </p>
      )}

      {/* Informations */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Type :</span>
          <Badge variant={
            platform.type === 'VIDEO' ? 'default' :
            platform.type === 'AUDIO' ? 'secondary' :
            platform.type === 'GAMING' ? 'destructive' :
            'outline'
          } className="text-xs">
            {platform.type === 'VIDEO' ? 'Vidéo' :
             platform.type === 'AUDIO' ? 'Audio' :
             platform.type === 'GAMING' ? 'Jeux' : platform.type}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Profils :</span>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-xs sm:text-sm">
              {platform.hasProfiles ? (
                platform.maxProfilesPerAccount ? 
                  `${platform.maxProfilesPerAccount} max` : 
                  'Illimité'
              ) : (
                'Non supporté'
              )}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Créé le :</span>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs sm:text-sm">{formatDate(platform.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-1 sm:space-x-2 border-t border-gray-100 pt-2 sm:pt-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-gray-100 h-8 w-8 p-0"
          title="Voir les détails"
        >
          <Link href={`/admin/streaming/platforms/${platform.id}`}>
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-gray-100 h-8 w-8 p-0"
          title="Modifier"
        >
          <Link href={`/admin/streaming/platforms/edit/${platform.id}`}>
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(platform.id)}
          className="hover:bg-gray-100 text-red-600 hover:text-red-700 h-8 w-8 p-0"
          disabled={isActionLoading === platform.id}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  )
} 