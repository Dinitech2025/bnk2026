const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateDatabaseStatuses() {
  try {
    console.log('🔄 MISE À JOUR DES STATUTS DANS LA BASE DE DONNÉES')
    console.log('')

    // 1. Analyser les statuts actuels
    console.log('1️⃣ ANALYSE DES STATUTS ACTUELS:')
    
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      orderBy: {
        _count: {
          status: 'desc'
        }
      }
    })

    console.log('📊 Répartition actuelle:')
    statusCounts.forEach(item => {
      console.log(`   • ${item.status}: ${item._count.status} commandes`)
    })
    console.log('')

    // 2. Identifier les statuts à corriger
    const invalidStatuses = ['QUOTE', 'SHIPPING', 'FINISHED', 'CONFIRMED']
    const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

    console.log('2️⃣ STATUTS À CORRIGER:')
    
    for (const oldStatus of invalidStatuses) {
      const count = await prisma.order.count({
        where: { status: oldStatus }
      })
      if (count > 0) {
        console.log(`   ❌ ${oldStatus}: ${count} commandes à corriger`)
      }
    }
    console.log('')

    // 3. Effectuer les corrections
    console.log('3️⃣ CORRECTIONS EN COURS:')
    
    let totalUpdated = 0

    // QUOTE → PENDING (déjà fait mais on vérifie)
    const quoteCount = await prisma.order.count({ where: { status: 'QUOTE' } })
    if (quoteCount > 0) {
      const quoteResult = await prisma.order.updateMany({
        where: { status: 'QUOTE' },
        data: { status: 'PENDING' }
      })
      console.log(`   ✅ QUOTE → PENDING: ${quoteResult.count} commandes`)
      totalUpdated += quoteResult.count
    }

    // CONFIRMED → PAID
    const confirmedCount = await prisma.order.count({ where: { status: 'CONFIRMED' } })
    if (confirmedCount > 0) {
      const confirmedResult = await prisma.order.updateMany({
        where: { status: 'CONFIRMED' },
        data: { status: 'PAID' }
      })
      console.log(`   ✅ CONFIRMED → PAID: ${confirmedResult.count} commandes`)
      totalUpdated += confirmedResult.count
    }

    // SHIPPING → SHIPPED
    const shippingCount = await prisma.order.count({ where: { status: 'SHIPPING' } })
    if (shippingCount > 0) {
      const shippingResult = await prisma.order.updateMany({
        where: { status: 'SHIPPING' },
        data: { status: 'SHIPPED' }
      })
      console.log(`   ✅ SHIPPING → SHIPPED: ${shippingResult.count} commandes`)
      totalUpdated += shippingResult.count
    }

    // FINISHED → DELIVERED
    const finishedCount = await prisma.order.count({ where: { status: 'FINISHED' } })
    if (finishedCount > 0) {
      const finishedResult = await prisma.order.updateMany({
        where: { status: 'FINISHED' },
        data: { status: 'DELIVERED' }
      })
      console.log(`   ✅ FINISHED → DELIVERED: ${finishedResult.count} commandes`)
      totalUpdated += finishedResult.count
    }

    console.log('')
    console.log(`📊 TOTAL CORRIGÉ: ${totalUpdated} commandes`)
    console.log('')

    // 4. Créer les entrées d'historique pour les corrections
    console.log('4️⃣ CRÉATION DE L\'HISTORIQUE:')
    
    if (totalUpdated > 0) {
      // Récupérer les commandes récemment mises à jour
      const updatedOrders = await prisma.order.findMany({
        where: {
          status: {
            in: validStatuses
          },
          updatedAt: {
            gte: new Date(Date.now() - 60000) // Dernière minute
          }
        },
        select: {
          id: true,
          status: true,
          orderNumber: true
        }
      })

      // Créer les entrées d'historique
      const historyEntries = []
      for (const order of updatedOrders) {
        let previousStatus = null
        let description = null

        // Déterminer l'ancien statut basé sur le nouveau
        if (order.status === 'PENDING') {
          previousStatus = 'QUOTE'
          description = 'Correction automatique: QUOTE → PENDING'
        } else if (order.status === 'PAID') {
          previousStatus = 'CONFIRMED'
          description = 'Correction automatique: CONFIRMED → PAID'
        } else if (order.status === 'SHIPPED') {
          previousStatus = 'SHIPPING'
          description = 'Correction automatique: SHIPPING → SHIPPED'
        } else if (order.status === 'DELIVERED') {
          previousStatus = 'FINISHED'
          description = 'Correction automatique: FINISHED → DELIVERED'
        }

        if (previousStatus && description) {
          historyEntries.push({
            orderId: order.id,
            status: order.status,
            previousStatus: previousStatus,
            action: 'STATUS_CORRECTION',
            description: description,
            userId: null // Correction automatique
          })
        }
      }

      if (historyEntries.length > 0) {
        await prisma.orderHistory.createMany({
          data: historyEntries
        })
        console.log(`   ✅ ${historyEntries.length} entrées d'historique créées`)
      }
    }
    console.log('')

    // 5. Vérification finale
    console.log('5️⃣ VÉRIFICATION FINALE:')
    
    const finalStatusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      orderBy: {
        _count: {
          status: 'desc'
        }
      }
    })

    console.log('📊 Répartition après correction:')
    finalStatusCounts.forEach(item => {
      const isValid = validStatuses.includes(item.status)
      const icon = isValid ? '✅' : '❌'
      console.log(`   ${icon} ${item.status}: ${item._count.status} commandes`)
    })
    console.log('')

    // Vérifier s'il reste des statuts invalides
    const remainingInvalid = finalStatusCounts.filter(item => 
      !validStatuses.includes(item.status)
    )

    if (remainingInvalid.length === 0) {
      console.log('🎉 TOUS LES STATUTS SONT MAINTENANT VALIDES!')
    } else {
      console.log('⚠️  STATUTS INVALIDES RESTANTS:')
      remainingInvalid.forEach(item => {
        console.log(`   ❌ ${item.status}: ${item._count.status} commandes`)
      })
    }
    console.log('')

    // 6. Résumé des statuts valides
    console.log('6️⃣ STATUTS VALIDES DANS LE SYSTÈME:')
    console.log('')
    validStatuses.forEach(status => {
      const count = finalStatusCounts.find(item => item.status === status)?._count.status || 0
      const translations = {
        'PENDING': 'En attente',
        'PAID': 'Payée',
        'PROCESSING': 'En cours',
        'SHIPPED': 'Expédiée',
        'DELIVERED': 'Livrée',
        'CANCELLED': 'Annulée',
        'REFUNDED': 'Remboursée'
      }
      console.log(`   ✅ ${status} (${translations[status]}): ${count} commandes`)
    })
    console.log('')

    console.log('✅ MISE À JOUR TERMINÉE!')
    console.log('')
    console.log('🔄 Maintenant, actualisez l\'interface admin pour voir les changements.')

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDatabaseStatuses().catch(console.error)
