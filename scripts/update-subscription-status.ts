import { PrismaClient } from '@prisma/client'
import { addDays, isBefore, isAfter } from 'date-fns'

const prisma = new PrismaClient()

/**
 * Script pour mettre à jour automatiquement le statut des abonnements selon les règles suivantes :
 * 1. Tout nouvel abonnement doit avoir le statut "ACTIVE" à la création
 * 2. Trois jours avant l'expiration, le statut passe à "CONTACT_NEEDED"
 * 3. À l'expiration, le statut passe à "EXPIRED"
 */
export async function updateSubscriptionStatuses() {
  console.log("Début de la mise à jour des statuts d'abonnements...")
  const now = new Date()
  const threeDaysFromNow = addDays(now, 3)

  try {
    // 1. Mettre à jour les abonnements en attente qui ont une date de début passée -> ACTIVE
    const pendingSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: 'PENDING',
        startDate: { lte: now }
      },
      data: {
        status: 'ACTIVE'
      }
    })
    console.log(`${pendingSubscriptions.count} abonnements en attente ont été activés`)

    // 2. Identifier les abonnements qui expirent dans les 3 prochains jours -> CONTACT_NEEDED
    const contactNeededSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: threeDaysFromNow,
          gt: now
        },
        contactNeeded: false
      },
      data: {
        status: 'CONTACT_NEEDED',
        contactNeeded: true
      }
    })
    console.log(`${contactNeededSubscriptions.count} abonnements ont été marqués comme nécessitant un contact`)

    // 3. Marquer les abonnements expirés -> EXPIRED
    const expiredSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: { in: ['ACTIVE', 'CONTACT_NEEDED'] },
        endDate: { lt: now }
      },
      data: {
        status: 'EXPIRED',
      }
    })
    console.log(`${expiredSubscriptions.count} abonnements ont été marqués comme expirés`)

    console.log("Mise à jour des statuts terminée avec succès")
    return { pendingSubscriptions, contactNeededSubscriptions, expiredSubscriptions }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statuts d'abonnements:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Si le script est exécuté directement (et non importé), exécuter la fonction principale
if (require.main === module) {
  updateSubscriptionStatuses()
    .then(() => {
      console.log('Script terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Erreur lors de l\'exécution du script:', error)
      process.exit(1)
    })
} 