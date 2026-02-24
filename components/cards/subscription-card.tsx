'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Eye, 
  Pencil, 
  Calendar,
  CreditCard,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  ShoppingCart,
  Key,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'
import { PriceDisplay } from '@/components/ui/price-display'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Platform {
  id: string
  name: string
  logo: string | null
  hasProfiles?: boolean
  maxProfilesPerAccount?: number
}

interface Account {
  id: string
  username: string | null
  email: string | null
}

interface AccountWithPlatform extends Account {
  platform: Platform
}

interface AccountProfile {
  id: string
  name: string | null
  profileSlot: number
  accountId: string
}

interface Subscription {
  id: string
  startDate: string
  endDate: string
  status: string
  autoRenew: boolean
  contactNeeded: boolean
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  offer: {
    id: string
    name: string
    price: number
    duration: number
    durationUnit?: string
  }
  platformOffer?: {
    platform: Platform
  }
  subscriptionAccounts: {
    account: AccountWithPlatform
  }[]
  accountProfiles: AccountProfile[]
}

interface SubscriptionCardProps {
  subscription: Subscription
  onStatusChange: (subscriptionId: string, newStatus: string, contactNeeded?: boolean) => void
  onClientContacted: (subscriptionId: string) => void
  onRenew: (subscriptionId: string) => void
  onDelete: (subscriptionId: string) => void
  isActionLoading: string | null
  calculateRemainingDays: (endDate: string) => number
  getStatusColor: (status: string) => string
}

export function SubscriptionCard({ 
  subscription, 
  onStatusChange,
  onClientContacted,
  onRenew, 
  onDelete, 
  isActionLoading, 
  calculateRemainingDays,
  getStatusColor
}: SubscriptionCardProps) {
  const remainingDays = calculateRemainingDays(subscription.endDate)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* En-tête avec client et statut */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
              {subscription.user.firstName || subscription.user.lastName
                ? `${subscription.user.firstName || ''} ${subscription.user.lastName || ''}`.trim()
                : 'Client'
              }
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">{subscription.user.email}</p>
          </div>
        </div>
        
        <Badge variant={getStatusColor(subscription.status) as any} className="text-xs">
          {subscription.status}
        </Badge>
      </div>

      {/* Offre et prix */}
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base">{subscription.offer.name}</h4>
          <PriceDisplay price={subscription.offer.price} size="small" />
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
          Durée : {formatDuration(subscription.offer.duration, subscription.offer.durationUnit || 'MONTH')}
        </div>
      </div>

      {/* Informations temporelles */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Jours restants :</span>
          <Badge variant={remainingDays <= 7 ? "destructive" : remainingDays <= 30 ? "warning" : "success"} className="text-xs">
            {remainingDays} jours
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Période :</span>
          <span className="text-xs sm:text-sm">{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</span>
        </div>
        
        {subscription.autoRenew && (
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Renouvellement :</span>
            <Badge variant="outline" className="text-xs">Automatique</Badge>
          </div>
        )}
      </div>

      {/* Comptes et profils */}
      {subscription.subscriptionAccounts.length > 0 && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 border border-gray-200 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Comptes assignés :</div>
          {subscription.subscriptionAccounts.slice(0, 2).map(({ account }) => (
            <div key={account.id} className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <Key className="h-3 w-3 text-gray-400" />
              <span className="text-xs sm:text-sm">{account.username}</span>
              <span className="text-xs text-gray-500">({account.platform.name})</span>
            </div>
          ))}
          {subscription.subscriptionAccounts.length > 2 && (
            <div className="text-xs text-gray-500">
              +{subscription.subscriptionAccounts.length - 2} autres comptes
            </div>
          )}
          
          {subscription.accountProfiles.length > 0 && (
            <div className="mt-1 sm:mt-2 flex items-center space-x-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600">
                {subscription.accountProfiles.length} profils assignés
              </span>
            </div>
          )}
        </div>
      )}

      {/* Contact nécessaire */}
      {subscription.contactNeeded && (
        <div className="mb-3 sm:mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-xs sm:text-sm text-orange-800 font-medium">Contact client requis</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClientContacted(subscription.id)}
            className="mt-1 sm:mt-2 text-orange-700 border-orange-300 h-6 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            title="Marquer comme contacté"
          >
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-gray-100 h-7 w-7 p-0 sm:h-8 sm:w-8"
            title="Voir les détails"
          >
            <Link href={`/admin/streaming/subscriptions/${subscription.id}`}>
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 h-7 w-7 p-0 sm:h-8 sm:w-8">
              <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange(subscription.id, "ACTIVE")}>
              Activer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(subscription.id, "PAUSED")}>
              Suspendre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(subscription.id, "CANCELLED", true)}>
              Annuler (Contact requis)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRenew(subscription.id)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Renouveler
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(subscription.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 