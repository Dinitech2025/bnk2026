'use client'

import { SubscriptionForm } from './subscription-form'

interface PartialUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone?: string | null
  createdAt?: Date
  subscriptions?: {
    id: string
    offer: {
      name: string
    }
  }[]
}

interface Platform {
  id: string
  name: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  logo?: string | null
}

interface Offer {
  id: string
  name: string
  duration: number
  durationUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  maxProfiles: number
  price: number
  description?: string | null
  features?: string[]
  platformOffers: {
    id: string
    profileCount: number
    platform: {
      id: string
      name: string
      hasProfiles: boolean
      maxProfilesPerAccount: number | null
      logo?: string | null
      isActive: boolean
    }
  }[]
}

interface NewSubscriptionFormProps {
  users: PartialUser[]
  offers: Offer[]
  platforms: Platform[]
}

export function NewSubscriptionForm({ users, offers, platforms }: NewSubscriptionFormProps) {
  return <SubscriptionForm users={users} offers={offers} platforms={platforms} />
} 
 
 
 