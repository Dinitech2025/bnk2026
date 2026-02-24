import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, addMonths, addWeeks, addYears, differenceInDays } from 'date-fns'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/utils'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Route pour renouveler un abonnement en créant un nouvel abonnement
 * avec les mêmes paramètres (offre, comptes, profils) que l'abonnement précédent
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const subscriptionId = params.id
    
    // Vérifier si l'abonnement existe avec tous les détails nécessaires
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId
      },
      include: {
        offer: true,
        subscriptionAccounts: {
          include: {
            account: true
          }
        },
        accountProfiles: {
          include: {
            account: true
          }
        }
      }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'abonnement peut être renouvelé
    if (existingSubscription.status === 'PENDING' || existingSubscription.endDate === null) {
      return NextResponse.json(
        { error: 'Cet abonnement ne peut pas être renouvelé' },
        { status: 400 }
      )
    }

    // Calculer les jours restants de l'abonnement actuel
    const today = new Date()
    const currentEndDate = new Date(existingSubscription.endDate)
    const remainingDays = Math.max(0, differenceInDays(currentEndDate, today))

    // Calculer la nouvelle période d'abonnement
    const startDate = new Date()
    let endDate = calculateEndDate(
      startDate, 
      existingSubscription.offer.duration, 
      existingSubscription.offer.durationUnit || 'MONTH'
    )

    // Ajouter les jours restants
    endDate = addDays(endDate, remainingDays)

    // Créer le nouvel abonnement et mettre à jour l'ancien
    const newSubscription = await prisma.$transaction(async (tx) => {
      // Générer le numéro de commande pour le renouvellement
      const lastOrder = await tx.order.findFirst({
        where: {
          orderNumber: {
            not: null
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          orderNumber: true
        }
      })

      const orderNumber = generateOrderNumber(lastOrder?.orderNumber, 'QUOTE')

      // Créer le nouvel abonnement
      const subscription = await tx.subscription.create({
        data: {
          userId: existingSubscription.userId,
          offerId: existingSubscription.offerId,
          platformOfferId: existingSubscription.platformOfferId,
          startDate: startDate,
          endDate: endDate,
          status: 'PENDING',
          autoRenew: existingSubscription.autoRenew,
          contactNeeded: false
        }
      })

      // Créer la commande associée avec le numéro de commande généré
      const order = await tx.order.create({
        data: {
          userId: existingSubscription.userId,
          orderNumber: orderNumber,
          status: 'QUOTE',
          total: existingSubscription.offer.price,
          subscriptions: {
            connect: {
              id: subscription.id
            }
          },
          items: {
            create: [{
              quantity: 1,
              unitPrice: existingSubscription.offer.price,
              totalPrice: existingSubscription.offer.price,
              itemType: 'SUBSCRIPTION',
              offerId: existingSubscription.offerId
            }]
          }
        }
      })

      console.log(`✅ Renouvellement créé - Commande: ${orderNumber}, Abonnement: ${subscription.id}`)

      // Copier les comptes de plateforme et leurs profils
      for (const subscriptionAccount of existingSubscription.subscriptionAccounts) {
        // Créer le lien compte-abonnement
        await tx.subscriptionAccount.create({
          data: {
            subscriptionId: subscription.id,
            accountId: subscriptionAccount.accountId,
            status: 'ACTIVE'
          }
        })

        // Récupérer les profils actuels du compte
        const currentProfiles = await tx.accountProfile.findMany({
          where: {
            accountId: subscriptionAccount.accountId
          }
        })

        // Récupérer les profils de l'ancien abonnement pour ce compte
        const oldProfiles = existingSubscription.accountProfiles.filter(
          p => p.accountId === subscriptionAccount.accountId
        )

        // Libérer les slots des profils de l'ancien abonnement
        for (const oldProfile of oldProfiles) {
          await tx.accountProfile.update({
            where: {
              id: oldProfile.id
            },
            data: {
              subscriptionId: subscription.id
            }
          })
        }
      }

      // Mettre à jour l'ancien abonnement
      await tx.subscription.update({
        where: { id: existingSubscription.id },
        data: { 
          status: 'EXPIRED',
          autoRenew: false,
          endDate: today
        }
      })

      return subscription
    })

    return NextResponse.json(newSubscription)
  } catch (error) {
    console.error('Erreur lors du renouvellement de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du renouvellement de l\'abonnement' },
      { status: 500 }
    )
  }
}

/**
 * Calcule la date de fin en fonction de la durée et de l'unité
 */
function calculateEndDate(startDate: Date, duration: number, unit: string): Date {
  switch (unit) {
    case 'DAY':
      return addDays(startDate, duration)
    case 'WEEK':
      return addDays(startDate, duration * 7)
    case 'MONTH':
      return addDays(startDate, duration * 30)
    case 'YEAR':
      return addDays(startDate, duration * 360)
    default:
      return addDays(startDate, duration * 30)
  }
} 