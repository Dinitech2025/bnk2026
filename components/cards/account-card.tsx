'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Globe, 
  Eye, 
  Pencil, 
  Calendar,
  Users,
  Key,
  Trash2,
  Check,
  X as XIcon,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  hasGiftCards: boolean
  hasProfiles: boolean
}

interface ProviderOffer {
  id: string
  name: string
  price: number
  currency: string
}

interface ActiveSubscription {
  id: string
  status: string
  endDate: string
  user: {
    firstName: string | null
    lastName: string | null
    email: string
  }
}

interface Account {
  id: string
  username: string
  email: string | null
  status: string
  availability: boolean
  platform: Platform
  providerOffer?: ProviderOffer | null
  createdAt: Date
  expiresAt: Date | null
  activeSubscription?: ActiveSubscription | null
  accountProfiles: {
    id: string
    isAssigned: boolean
  }[]
}

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
  onRecharge: (account: Account) => void
  isActionLoading: string | null
  calculateDaysRemaining: (expiresAt: Date | null) => number | null
}

export function AccountCard({ 
  account, 
  onDelete, 
  onRecharge, 
  isActionLoading, 
  calculateDaysRemaining 
}: AccountCardProps) {
  const daysRemaining = calculateDaysRemaining(account.expiresAt)
  
  const getDaysRemainingBadge = (daysRemaining: number | null) => {
    if (daysRemaining === null) return null
    
    if (daysRemaining > 30) {
      return <Badge variant="success">{daysRemaining} jours</Badge>
    } else if (daysRemaining > 7) {
      return <Badge variant="warning">{daysRemaining} jours</Badge>
    } else if (daysRemaining > 0) {
      return <Badge variant="destructive">{daysRemaining} jours</Badge>
    } else {
      return <Badge variant="secondary">Expiré</Badge>
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* En-tête avec plateforme et statut */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
            {account.platform.logo ? (
              <img 
                src={account.platform.logo} 
                alt={account.platform.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{account.platform.name}</h3>
            <div className="flex items-center space-x-1">
              <Key className="h-3 w-3 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600">{account.username}</span>
            </div>
          </div>
        </div>
        
        <Badge variant={
          account.status === 'ACTIVE' ? 'success' :
          account.status === 'INACTIVE' ? 'secondary' :
          account.status === 'SUSPENDED' ? 'destructive' :
          'outline'
        } className="text-xs">
          {account.status === 'ACTIVE' ? 'Actif' :
           account.status === 'INACTIVE' ? 'Inactif' :
           account.status === 'SUSPENDED' ? 'Suspendu' : account.status}
        </Badge>
      </div>

      {/* Email si disponible */}
      {account.email && (
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{account.email}</p>
      )}

      {/* Informations */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Jours restants :</span>
          {getDaysRemainingBadge(daysRemaining)}
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Disponibilité :</span>
          <div className="flex flex-col items-end">
            <Badge variant={account.availability ? 'success' : 'secondary'} className="text-xs">
              {account.availability ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <XIcon className="h-3 w-3 mr-1" />
              )}
              {account.availability ? 'Disponible' : 'Non disponible'}
            </Badge>
            {!account.availability && account.activeSubscription && !account.platform.hasProfiles && (
              <div className="text-xs text-orange-600 mt-1">
                Utilisé par {account.activeSubscription.user.firstName || account.activeSubscription.user.lastName 
                  ? `${account.activeSubscription.user.firstName || ''} ${account.activeSubscription.user.lastName || ''}`.trim()
                  : account.activeSubscription.user.email
                }
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Profils :</span>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-xs sm:text-sm">
              {account.accountProfiles.filter(p => p.isAssigned).length}/{account.accountProfiles.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Expiration :</span>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs sm:text-sm">
              {account.expiresAt ? formatDate(account.expiresAt) : 'Pas d\'expiration'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {account.platform.hasGiftCards && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRecharge(account)}
              className="text-green-600 border-green-600 hover:bg-green-50 h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
              title="Recharger le compte"
            >
              <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-gray-100 h-7 w-7 p-0 sm:h-8 sm:w-8"
            title="Voir les détails"
          >
            <Link href={`/admin/streaming/accounts/${account.id}`}>
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
            <Link href={`/admin/streaming/accounts/${account.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(account.id)}
            className="hover:bg-gray-100 text-red-600 hover:text-red-700 h-7 w-7 p-0 sm:h-8 sm:w-8"
            disabled={isActionLoading === account.id}
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 