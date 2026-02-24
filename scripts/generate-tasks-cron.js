const { PrismaClient } = require('@prisma/client')
const { addDays, addHours, startOfDay, endOfDay } = require('date-fns')

const prisma = new PrismaClient()

async function generateTasks() {
  console.log('🔄 [CRON] Génération automatique des tâches...')
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`)
  
  let totalCreated = 0
  const errors = []

  try {
    // 1. Tâches d'expiration d'abonnements
    console.log('\n📋 Génération des tâches d'expiration d'abonnements...')
    const subscriptionResult = await generateSubscriptionExpiryTasks()
    totalCreated += subscriptionResult.created
    errors.push(...subscriptionResult.errors)
    console.log(`✅ ${subscriptionResult.created} tâches créées`)

    // 2. Tâches de recharge de comptes
    console.log('\n🔋 Génération des tâches de recharge de comptes...')
    const rechargeResult = await generateAccountRechargeTasks()
    totalCreated += rechargeResult.created
    errors.push(...rechargeResult.errors)
    console.log(`✅ ${rechargeResult.created} tâches créées`)

    // 3. Tâches de rappel de paiement
    console.log('\n💰 Génération des tâches de rappel de paiement...')
    const paymentResult = await generatePaymentReminderTasks()
    totalCreated += paymentResult.created
    errors.push(...paymentResult.errors)
    console.log(`✅ ${paymentResult.created} tâches créées`)

    // 4. Tâches de prospection (2 par jour ouvrable)
    console.log('\n🎯 Génération des tâches de prospection...')
    const prospectionResult = await generateProspectionTasks()
    totalCreated += prospectionResult.created
    errors.push(...prospectionResult.errors)
    console.log(`✅ ${prospectionResult.created} tâches créées`)

    // 5. Tâches de retrait de clients expirés
    console.log('\n👥 Génération des tâches de retrait de clients...')
    const removeResult = await generateRemoveExpiredClientsTasks()
    totalCreated += removeResult.created
    errors.push(...removeResult.errors)
    console.log(`✅ ${removeResult.created} tâches créées`)

    console.log(`\n✨ Total: ${totalCreated} tâches créées`)
    
    if (errors.length > 0) {
      console.error(`\n❌ ${errors.length} erreurs:`)
      errors.forEach(err => console.error(`  - ${err}`))
    }
  } catch (error) {
    console.error('❌ Erreur globale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function generateSubscriptionExpiryTasks() {
  const result = { created: 0, errors: [] }
  
  try {
    const sevenDaysFromNow = addDays(new Date(), 7)
    const today = new Date()

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: true,
        offer: true,
        tasks: {
          where: {
            type: 'SUBSCRIPTION_EXPIRY',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    })

    for (const subscription of expiringSubscriptions) {
      if (subscription.tasks.length === 0) {
        try {
          const daysUntilExpiry = Math.ceil(
            (subscription.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )

          await prisma.task.create({
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
          result.errors.push(`Erreur pour l'abonnement ${subscription.id}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error.message}`)
  }

  return result
}

async function generateAccountRechargeTasks() {
  const result = { created: 0, errors: [] }
  
  try {
    const fiveDaysFromNow = addDays(new Date(), 5)
    const today = new Date()

    const expiringAccounts = await prisma.account.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: today,
          lte: fiveDaysFromNow,
        },
      },
      include: {
        platform: true,
        tasks: {
          where: {
            type: 'ACCOUNT_RECHARGE',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    })

    for (const account of expiringAccounts) {
      if (account.tasks.length === 0 && account.expiresAt) {
        try {
          const daysUntilExpiry = Math.ceil(
            (account.expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )

          await prisma.task.create({
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
          result.errors.push(`Erreur pour le compte ${account.id}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error.message}`)
  }

  return result
}

async function generatePaymentReminderTasks() {
  const result = { created: 0, errors: [] }
  
  try {
    const twoDaysAgo = addDays(new Date(), -2)

    const pendingSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: twoDaysAgo },
      },
      include: {
        user: true,
        offer: true,
        tasks: {
          where: {
            type: 'PAYMENT_REMINDER',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    })

    for (const subscription of pendingSubscriptions) {
      if (subscription.tasks.length === 0) {
        try {
          await prisma.task.create({
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
                subscriptionCreatedAt: subscription.createdAt,
              },
            },
          })

          result.created++
        } catch (error) {
          result.errors.push(`Erreur pour l'abonnement ${subscription.id}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error.message}`)
  }

  return result
}

async function generateProspectionTasks() {
  const result = { created: 0, errors: [] }
  
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return result
    }

    const existingTasks = await prisma.task.findMany({
      where: {
        type: 'PROSPECTION',
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    })

    const tasksToCreate = 2 - existingTasks.length

    for (let i = 0; i < tasksToCreate; i++) {
      try {
        await prisma.task.create({
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
        result.errors.push(`Erreur prospection ${i + 1}: ${error.message}`)
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error.message}`)
  }

  return result
}

async function generateRemoveExpiredClientsTasks() {
  const result = { created: 0, errors: [] }
  
  try {
    const today = new Date()

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        endDate: { lt: today },
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      include: {
        user: true,
        accountProfiles: {
          where: { isAssigned: true },
        },
        tasks: {
          where: {
            type: 'REMOVE_CLIENT',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    })

    for (const subscription of expiredSubscriptions) {
      if (subscription.accountProfiles.length > 0 && subscription.tasks.length === 0) {
        try {
          await prisma.task.create({
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
          result.errors.push(`Erreur pour l'abonnement ${subscription.id}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Erreur globale: ${error.message}`)
  }

  return result
}

// Exécuter le script
generateTasks()

