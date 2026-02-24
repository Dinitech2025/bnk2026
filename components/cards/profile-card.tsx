'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Eye, 
  Pencil, 
  Key,
  UserCircle,
  Globe,
  Shield,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface Platform {
  id: string
  name: string
  logo: string | null
  maxProfilesPerAccount: number | null
}

interface Account {
  id: string
  username: string | null
  platform: Platform
}

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
}

interface Profile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  account: Account
  accountId: string
  subscription: Subscription | null
  subscriptionId: string | null
}

interface ProfileCardProps {
  profile: Profile
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* En-tête avec profil et statut */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
              {profile.name || `Profil ${profile.profileSlot}`}
            </h3>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600">Slot {profile.profileSlot}</span>
            </div>
          </div>
        </div>
        
        <Badge variant={profile.isAssigned ? 'success' : 'secondary'} className="text-xs">
          {profile.isAssigned ? 'Assigné' : 'Libre'}
        </Badge>
      </div>

      {/* Informations du compte */}
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-1 sm:mb-2">
          <div className="h-5 w-5 sm:h-6 sm:w-6 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
            {profile.account.platform.logo ? (
              <img 
                src={profile.account.platform.logo} 
                alt={profile.account.platform.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-medium">{profile.account.platform.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Key className="h-3 w-3 text-gray-400" />
          <span className="text-xs sm:text-sm text-gray-600">{profile.account.username}</span>
        </div>
      </div>

      {/* Informations du profil */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        {profile.pin && (
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">PIN :</span>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-gray-400" />
              <span className="font-mono text-xs">****</span>
            </div>
          </div>
        )}
        
        {profile.subscription && (
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Abonnement :</span>
            <Badge variant={
              profile.subscription.status === 'ACTIVE' ? 'success' :
              profile.subscription.status === 'PAUSED' ? 'warning' :
              profile.subscription.status === 'CANCELLED' ? 'destructive' :
              'secondary'
            } className="text-xs">
              {profile.subscription.status}
            </Badge>
          </div>
        )}
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
          <Link href={`/admin/streaming/profiles/${profile.id}`}>
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
          <Link href={`/admin/streaming/profiles/${profile.id}/edit`}>
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
} 