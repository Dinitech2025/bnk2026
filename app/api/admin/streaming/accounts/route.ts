import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { requireStaff } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, Account, AccountProfile, GiftCard, Platform } from '@prisma/client'

type AccountWithDetails = {
  id: string;
  platformId: string;
  username: string;
  email: string | null;
  password: string;
  status: string;
  expiresAt: Date | null;
  platform: Platform;
  accountProfiles: AccountProfile[];
}

type AccountWithRelations = Account & {
  platform: { id: string; hasProfiles: boolean };
  accountProfiles: AccountProfile[];
  usedGiftCards: GiftCard[];
}

// GET - Récupérer tous les comptes (avec filtre optionnel par plateforme)
export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')
    const userId = searchParams.get('userId')

    // Construire les conditions de filtrage
    const whereConditions: any = {}
    
    // Si platformId est spécifié, filtrer par plateforme
    if (platformId) {
      whereConditions.platformId = platformId
    }

    // Si userId est spécifié, filtrer par utilisateur (comptes appartenant à cet utilisateur)
    if (userId) {
      whereConditions.userId = userId
    }

    const accounts = await prisma.account.findMany({
      where: whereConditions,
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            type: true,
            hasProfiles: true,
            hasGiftCards: true,
            maxProfilesPerAccount: true
          }
        },
        accountProfiles: {
          select: {
            id: true,
            isAssigned: true,
            profileSlot: true,
            name: true
          }
        },
        providerOffer: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true
          }
        },
        subscriptionAccounts: {
          where: {
            subscription: {
              status: 'ACTIVE',
              endDate: {
                gte: new Date()
              }
            }
          },
          include: {
            subscription: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          },
          take: 1
        }
      },
      orderBy: [
        { platform: { name: 'asc' } },
        { username: 'asc' }
      ]
    })

    // Traiter les données des comptes avec toutes les informations nécessaires
    const accountsWithDetails = accounts.map((account) => {
      const usedProfiles = account.accountProfiles.filter(profile => profile.isAssigned).length
      const totalProfiles = account.accountProfiles.length
      
      // Récupérer l'abonnement actif s'il existe
      const activeSubscription = account.subscriptionAccounts.length > 0 
        ? account.subscriptionAccounts[0].subscription 
        : null

      return {
        id: account.id,
        username: account.username,
        email: account.email,
        status: account.status,
        availability: account.availability,
        expiresAt: account.expiresAt,
        createdAt: account.createdAt,
        platform: account.platform,
        providerOffer: account.providerOffer,
        accountProfiles: account.accountProfiles,
        activeSubscription: activeSubscription,
        profilesUsed: usedProfiles,
        maxProfiles: account.platform.maxProfilesPerAccount || totalProfiles,
        availableProfiles: totalProfiles - usedProfiles
      }
    })

    return NextResponse.json(accountsWithDetails)
  } catch (error) {
    console.error('[ACCOUNTS_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Créer un nouveau compte
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }
    
    const data = await request.json()

    // Validation des données
    if (!data.username || !data.password || !data.platformId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier si la plateforme existe
    const platform = await prisma.platform.findUnique({
      where: { id: data.platformId }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Si une carte cadeau est spécifiée, vérifier qu'elle est disponible
    if (data.giftCardId) {
      const giftCard = await prisma.giftCard.findFirst({
        where: {
          id: data.giftCardId,
          platformId: platform.id,
          status: 'ACTIVE',
          usedById: null
        }
      })

      if (!giftCard) {
        return NextResponse.json(
          { error: 'Carte cadeau invalide ou déjà utilisée' },
          { status: 400 }
        )
      }
    }

    // Déterminer la date d'expiration
    let expirationDate = data.expiresAt ? new Date(data.expiresAt) : null
    
    // Déterminer le statut en fonction de la date d'expiration
    const now = new Date()
    const isActive = expirationDate ? expirationDate > now : false
    const status = isActive ? 'ACTIVE' : 'INACTIVE'

    // Créer le compte dans une transaction
    const account = await prisma.$transaction(async (tx) => {
    // Créer le compte
      const newAccount = await tx.account.create({
        data: {
          username: data.username,
          email: data.email || null,
          password: data.password,
          status: status,
          expiresAt: expirationDate,
          platform: {
            connect: {
              id: data.platformId
            }
          },
          ...(data.providerOfferId && {
            providerOffer: {
              connect: {
                id: data.providerOfferId
              }
            }
          })
        }
      })

      // Si une carte cadeau est fournie, l'associer au compte
      if (data.giftCardId) {
        await tx.giftCard.update({
          where: { id: data.giftCardId },
      data: {
            status: 'USED',
            usedById: newAccount.id,
            usedAt: new Date()
          }
        })
      }

      // Si la plateforme utilise des profils, créer les profils par défaut
      if (platform.hasProfiles) {
        const maxProfiles = platform.maxProfilesPerAccount || 1
        const profiles = Array.from({ length: maxProfiles }).map((_, index) => ({
          accountId: newAccount.id,
            profileSlot: index + 1,
          name: index === 0 ? 'Principal' : `Profil ${index + 1}`,
          pin: null,
            isAssigned: false
          }))

        await tx.accountProfile.createMany({
          data: profiles
        })
      }

      // Récupérer le compte avec tous les détails
      const accountWithDetails = await tx.account.findUnique({
        where: { id: newAccount.id },
      include: {
        platform: true,
        accountProfiles: true
      }
      })

      if (!accountWithDetails) {
        throw new Error('Compte non trouvé après création')
      }

      // Déterminer la disponibilité selon les nouvelles règles
      let isAvailable = false
      let activeSubscription = null
      
      if (status === 'ACTIVE') {
        if (platform.hasProfiles) {
          // Pour les plateformes avec profils, vérifier s'il y a des profils non assignés
          const hasUnassignedProfiles = accountWithDetails.accountProfiles.some(profile => !profile.isAssigned)
          isAvailable = hasUnassignedProfiles
        } else {
          // Pour les plateformes sans profils, vérifier s'il y a un abonnement actif
          activeSubscription = await prisma.subscription.findFirst({
            where: {
              subscriptionAccounts: {
                some: {
                  accountId: accountWithDetails.id
                }
              },
              status: 'ACTIVE',
              endDate: {
                gte: new Date() // Date de fin dans le futur
              }
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          })

          // Le compte est disponible seulement s'il n'y a pas d'abonnement actif
          isAvailable = !activeSubscription
        }
      }

      // Mettre à jour la disponibilité
      await tx.$executeRaw`
        UPDATE "Account" 
        SET availability = ${isAvailable}
        WHERE id = ${newAccount.id}
      `

      return accountWithDetails
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    )
  }
} 