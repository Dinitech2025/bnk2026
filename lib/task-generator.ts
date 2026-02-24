import { db } from '@/lib/db'
import { addDays, addHours, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'

export interface TaskGenerationResult {
  created: number
  errors: string[]
}

/**
 * Génère automatiquement les tâches pour les abonnements qui expirent bientôt
 */
export async function generateSubscriptionExpiryTasks(): Promise<TaskGenerationResult> {
  const result: TaskGenerationResult = { created: 0, errors: [] }
  
  try {
    // Trouver les abonnements qui expirent dans les 7 prochains jours
    const sevenDaysFromNow = addDays(new Date(), 7)
    const today = new Date()

    const expiringSubscriptions = await db.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offer: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          where: {
            type: 'SUBSCRIPTION_EXPIRY',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
    })

    for (const subscription of expiringSubscriptions) {
      // Vérifier si une tâche existe déjà pour cet abonnement
      if (subscription.tasks.length === 0) {
        try {
          const daysUntilExpiry = Math.ceil(
            (subscription.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )

          await db.task.create({
            data: {
              title: `Abonnement expirant - ${subscription.user.name || subscription.user.email}`,
              description: `L'abonnement "${subscription.offer.name}" de ${subscription.user.name || subscription.user.email} expire dans ${daysUntilExpiry} jour(s). Contacter le client pour renouvellement.`,
              type: 'SUBSCRIPTION_EXPIRY',
              priority: daysUntilExpiry <= 3 ? 'HIGH' : 'MEDIUM',
              status: 'PENDING',
              dueDate: subscription.endDate,
              relatedUserId: subscription.userId,
              relatedSubscriptionId: subscription.id,
              metadata: {
                subscriptionEndDate: subscription.endDate,
                offerName: subscription.offer.name,
                daysUntilExpiry,
              },
            },
          })

          result.created++
        } catch (error) {
          result.errors.push(`Erreur pour l'abonnement ${subscription.id}: ${error}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error}`)
  }

  return result
}

/**
 * Génère des tâches pour les comptes streaming qui doivent être rechargés
 */
export async function generateAccountRechargeTasks(): Promise<TaskGenerationResult> {
  const result: TaskGenerationResult = { created: 0, errors: [] }
  
  try {
    // Trouver les comptes qui expirent dans les 5 prochains jours
    const fiveDaysFromNow = addDays(new Date(), 5)
    const today = new Date()

    const expiringAccounts = await db.account.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: today,
          lte: fiveDaysFromNow,
        },
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tasks: {
          where: {
            type: 'ACCOUNT_RECHARGE',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
    })

    for (const account of expiringAccounts) {
      // Vérifier si une tâche existe déjà pour ce compte
      if (account.tasks.length === 0 && account.expiresAt) {
        try {
          const daysUntilExpiry = Math.ceil(
            (account.expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )

          await db.task.create({
            data: {
              title: `Recharger compte ${account.platform.name}`,
              description: `Le compte ${account.username} (${account.platform.name}) expire dans ${daysUntilExpiry} jour(s). Recharger le compte avant expiration.`,
              type: 'ACCOUNT_RECHARGE',
              priority: daysUntilExpiry <= 2 ? 'URGENT' : 'HIGH',
              status: 'PENDING',
              dueDate: account.expiresAt,
              relatedAccountId: account.id,
              metadata: {
                accountUsername: account.username,
                platformName: account.platform.name,
                expiresAt: account.expiresAt,
                daysUntilExpiry,
              },
            },
          })

          result.created++
        } catch (error) {
          result.errors.push(`Erreur pour le compte ${account.id}: ${error}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error}`)
  }

  return result
}

/**
 * Génère des tâches de rappel de paiement pour les abonnements impayés
 */
export async function generatePaymentReminderTasks(): Promise<TaskGenerationResult> {
  const result: TaskGenerationResult = { created: 0, errors: [] }
  
  try {
    // Trouver les abonnements avec statut PENDING depuis plus de 2 jours
    const twoDaysAgo = addDays(new Date(), -2)

    const pendingSubscriptions = await db.subscription.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: twoDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        offer: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        tasks: {
          where: {
            type: 'PAYMENT_REMINDER',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
    })

    for (const subscription of pendingSubscriptions) {
      // Vérifier si une tâche existe déjà pour cet abonnement
      if (subscription.tasks.length === 0) {
        try {
          await db.task.create({
            data: {
              title: `Rappel de paiement - ${subscription.user.name || subscription.user.email}`,
              description: `L'abonnement "${subscription.offer.name}" de ${subscription.user.name || subscription.user.email} est en attente de paiement depuis ${Math.ceil((new Date().getTime() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24))} jours. Contacter le client.`,
              type: 'PAYMENT_REMINDER',
              priority: 'MEDIUM',
              status: 'PENDING',
              dueDate: addDays(new Date(), 1),
              relatedUserId: subscription.userId,
              relatedSubscriptionId: subscription.id,
              metadata: {
                offerName: subscription.offer.name,
                offerPrice: subscription.offer.price,
                subscriptionCreatedAt: subscription.createdAt,
              },
            },
          })

          result.created++
        } catch (error) {
          result.errors.push(`Erreur pour l'abonnement ${subscription.id}: ${error}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error}`)
  }

  return result
}

/**
 * Génère des tâches de prospection quotidiennes
 */
export async function generateProspectionTasks(): Promise<TaskGenerationResult> {
  const result: TaskGenerationResult = { created: 0, errors: [] }
  
  try {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Dimanche, 6 = Samedi
    
    // Vérifier si c'est un jour ouvrable (Lundi à Vendredi)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return result // Pas de prospection le weekend
    }

    // Vérifier si des tâches de prospection existent déjà pour aujourd'hui
    const existingTasks = await db.task.findMany({
      where: {
        type: 'PROSPECTION',
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    })

    // Créer 2 tâches de prospection par jour ouvrable
    const tasksToCreate = 2 - existingTasks.length

    for (let i = 0; i < tasksToCreate; i++) {
      try {
        await db.task.create({
          data: {
            title: `Prospection réseaux sociaux ${i + 1 + existingTasks.length}/2`,
            description: `Faire de la prospection sur les réseaux sociaux pour trouver de nouveaux clients intéressés par les abonnements streaming. Objectif: contacter au moins 10 prospects.`,
            type: 'PROSPECTION',
            priority: 'LOW',
            status: 'PENDING',
            dueDate: endOfDay(today),
            isRecurring: true,
            recurrenceType: 'DAILY',
            recurrenceValue: 2,
            lastGenerated: today,
            metadata: {
              targetProspects: 10,
              platforms: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn'],
            },
          },
        })

        result.created++
      } catch (error) {
        result.errors.push(`Erreur lors de la création de la tâche de prospection ${i + 1}: ${error}`)
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error}`)
  }

  return result
}

/**
 * Génère des tâches pour retirer les clients des comptes expirés
 */
export async function generateRemoveExpiredClientsTasks(): Promise<TaskGenerationResult> {
  const result: TaskGenerationResult = { created: 0, errors: [] }
  
  try {
    const today = new Date()

    // Trouver les abonnements expirés avec des profils encore assignés
    const expiredSubscriptions = await db.subscription.findMany({
      where: {
        endDate: {
          lt: today,
        },
        status: {
          in: ['ACTIVE', 'EXPIRED'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accountProfiles: {
          where: {
            isAssigned: true,
          },
        },
        tasks: {
          where: {
            type: 'REMOVE_CLIENT',
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
    })

    for (const subscription of expiredSubscriptions) {
      // Vérifier si des profils sont encore assignés et qu'aucune tâche n'existe
      if (subscription.accountProfiles.length > 0 && subscription.tasks.length === 0) {
        try {
          await db.task.create({
            data: {
              title: `Retirer client du compte - ${subscription.user.name || subscription.user.email}`,
              description: `L'abonnement de ${subscription.user.name || subscription.user.email} a expiré. Retirer le client du compte streaming (${subscription.accountProfiles.length} profil(s) assigné(s)).`,
              type: 'REMOVE_CLIENT',
              priority: 'HIGH',
              status: 'PENDING',
              dueDate: today,
              relatedUserId: subscription.userId,
              relatedSubscriptionId: subscription.id,
              metadata: {
                profilesCount: subscription.accountProfiles.length,
                expiredDate: subscription.endDate,
              },
            },
          })

          result.created++
        } catch (error) {
          result.errors.push(`Erreur pour l'abonnement ${subscription.id}: ${error}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error}`)
  }

  return result
}

/**
 * Fonction principale pour générer toutes les tâches automatiques
 */
export async function generateAllAutomaticTasks(): Promise<{
  subscriptionExpiry: TaskGenerationResult
  accountRecharge: TaskGenerationResult
  paymentReminder: TaskGenerationResult
  prospection: TaskGenerationResult
  removeExpiredClients: TaskGenerationResult
}> {
  const [
    subscriptionExpiry,
    accountRecharge,
    paymentReminder,
    prospection,
    removeExpiredClients,
  ] = await Promise.all([
    generateSubscriptionExpiryTasks(),
    generateAccountRechargeTasks(),
    generatePaymentReminderTasks(),
    generateProspectionTasks(),
    generateRemoveExpiredClientsTasks(),
  ])

  return {
    subscriptionExpiry,
    accountRecharge,
    paymentReminder,
    prospection,
    removeExpiredClients,
  }
}

