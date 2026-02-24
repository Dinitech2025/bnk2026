'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Calendar,
  CreditCard,
  User,
  Trash2,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatPrice } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  logo: string | null
}

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
  platform: Platform
  usedBy: {
    email: string
  } | null
  usedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface GiftCardCardProps {
  giftCard: GiftCard
  onDelete: (id: string) => void
  isActionLoading: string | null
}

export function GiftCardCard({ giftCard, onDelete, isActionLoading }: GiftCardCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Actif</Badge>
      case 'USED':
        return <Badge variant="secondary">Utilisé</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expiré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* En-tête avec plateforme et statut */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
            {giftCard.platform.logo ? (
              <img 
                src={giftCard.platform.logo} 
                alt={giftCard.platform.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{giftCard.platform.name}</h3>
            <div className="flex items-center space-x-1">
              <CreditCard className="h-3 w-3 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 font-mono">{giftCard.code}</span>
            </div>
          </div>
        </div>
        
        {getStatusBadge(giftCard.status)}
      </div>

      {/* Montant principal */}
      <div className="text-center py-3 sm:py-4 mb-3 sm:mb-4 bg-gray-50 rounded-lg">
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          {formatPrice(giftCard.amount, giftCard.currency)}
        </div>
      </div>

      {/* Informations */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        {giftCard.usedBy && (
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Utilisé par :</span>
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-right text-xs sm:text-sm">{giftCard.usedBy.email}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Expire le :</span>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs sm:text-sm">
              {giftCard.expiresAt ? formatDate(giftCard.expiresAt) : 'Non définie'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Créé le :</span>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs sm:text-sm">{formatDate(giftCard.createdAt)}</span>
          </div>
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
          <Link href={`/admin/streaming/gift-cards/${giftCard.id}`}>
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(giftCard.id)}
          className="hover:bg-gray-100 text-red-600 hover:text-red-700 h-7 w-7 p-0 sm:h-8 sm:w-8"
          disabled={isActionLoading === giftCard.id}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  )
} 