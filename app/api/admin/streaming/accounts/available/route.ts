import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for authentication routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const offerId = searchParams.get('offerId')

    if (!userId || !offerId) {
      return NextResponse.json(
        { error: 'userId et offerId requis' },
        { status: 400 }
      )
    }

    // Récupérer l'offre pour connaître les plateformes compatibles
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offre non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les plateformes compatibles avec cette offre
    const compatiblePlatformIds = offer.platformOffers.map(po => po.platform.id)

    // Récupérer les comptes disponibles pour ce client sur les plateformes compatibles
    const availableAccounts = await prisma.streamingAccount.findMany({
      where: {
        platform: {
          id: {
            in: compatiblePlatformIds
          }
        },
        status: 'ACTIVE',
        // Vérifier qu'il y a de la place pour de nouveaux profils
        OR: [
          {
            // Comptes sans limite de profils définie
            maxProfiles: null
          },
          {
            // Comptes avec de la place disponible
            subscriptions: {
              every: {
                // Pas d'abonnements actifs ou nombre de profils utilisés < max
                OR: [
                  { status: { not: 'ACTIVE' } },
                  {
                    AND: [
                      { status: 'ACTIVE' },
                      {
                        subscriptionAccounts: {
                          none: {}
                        }
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            subscriptionAccounts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculer les profils utilisés pour chaque compte
    const accountsWithUsage = availableAccounts.map(account => {
      const activeSubscriptions = account.subscriptions.filter(sub => sub.status === 'ACTIVE')
      const profilesUsed = activeSubscriptions.reduce((total, sub) => {
        return total + (sub.subscriptionAccounts?.length || 0)
      }, 0)

      return {
        id: account.id,
        email: account.email,
        username: account.username,
        status: account.status,
        maxProfiles: account.maxProfiles,
        profilesUsed,
        platform: account.platform,
        availableSlots: account.maxProfiles ? Math.max(0, account.maxProfiles - profilesUsed) : 999
      }
    })

    // Filtrer les comptes qui ont encore de la place
    const filteredAccounts = accountsWithUsage.filter(account => 
      account.availableSlots > 0
    )

    return NextResponse.json(filteredAccounts)

  } catch (error) {
    console.error('Erreur lors de la récupération des comptes disponibles:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des comptes disponibles',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}



