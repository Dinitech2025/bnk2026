import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { NewSubscriptionForm } from './new-subscription-form'

export const metadata: Metadata = {
  title: 'Nouvel abonnement',
  description: 'Créer un nouvel abonnement pour un client',
}

// Définir le type Platform pour assurer la cohérence
interface Platform {
  id: string
  name: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  logo: string | null
}

async function getFormData() {
  const [users, offers, platformsData] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'CLIENT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            offer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    }),
    prisma.offer.findMany({
      where: {
        isActive: true,
        platformOffers: {
          some: {
            platform: {
              isActive: true
            }
          }
        }
      },
      include: {
        platformOffers: {
          where: {
            platform: {
              isActive: true
            }
          },
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
                hasProfiles: true,
                maxProfilesPerAccount: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.platform.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        logo: true,
        hasProfiles: true,
        maxProfilesPerAccount: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  // Assurer que les plateformes respectent bien l'interface Platform
  const platforms: Platform[] = platformsData.map(platform => ({
    id: platform.id,
    name: platform.name,
    logo: platform.logo,
    hasProfiles: platform.hasProfiles,
    maxProfilesPerAccount: platform.maxProfilesPerAccount
  }))

  const transformedOffers = offers.map((offer: any) => ({
    ...offer,
    features: offer.features ? JSON.parse(offer.features as string) : [],
    platformOffers: offer.platformOffers.map((po: any) => ({
      ...po,
      profileCount: po.profileCount || 1
    }))
  }))

  return { 
    users: users.map(user => ({
      ...user,
      email: user.email || ""
    })), 
    offers: transformedOffers, 
    platforms 
  }
}

export default async function NewSubscriptionPage() {
  const { users, offers, platforms } = await getFormData()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nouvel abonnement</h1>
        <p className="text-muted-foreground">
          Créez un nouvel abonnement pour un client
        </p>
      </div>
      <NewSubscriptionForm users={users} offers={offers} platforms={platforms} />
    </div>
  )
} 
 
 
 