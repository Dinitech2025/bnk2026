const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixPaymentStatuses() {
  console.log('🔧 CORRECTION DES STATUTS DE PAIEMENT')
  console.log('')

  try {
    // 1. Récupérer toutes les commandes avec leurs paiements
    const orders = await prisma.order.findMany({
      include: {
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    console.log(`📊 ANALYSE DE ${orders.length} COMMANDES...`)
    console.log('')

    let corrections = []
    let alreadyCorrect = 0

    for (const order of orders) {
      const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const totalOrder = Number(order.total)

      // Déterminer le statut correct basé sur les paiements
      let correctStatus
      let correctPaymentStatus
      
      if (totalPaid === 0) {
        correctStatus = 'PENDING'
        correctPaymentStatus = 'PENDING'
      } else if (totalPaid >= totalOrder) {
        // Si entièrement payé, garder le statut actuel s'il est avancé (PROCESSING, SHIPPED, DELIVERED)
        // Sinon, mettre PAID
        const advancedStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED']
        correctStatus = advancedStatuses.includes(order.status) ? order.status : 'PAID'
        correctPaymentStatus = 'PAID'
      } else {
        correctStatus = 'PARTIALLY_PAID'
        correctPaymentStatus = 'PARTIALLY_PAID'
      }

      // Vérifier si une correction est nécessaire
      const needsStatusCorrection = order.status !== correctStatus
      const needsPaymentStatusCorrection = order.paymentStatus !== correctPaymentStatus

      if (needsStatusCorrection || needsPaymentStatusCorrection) {
        corrections.push({
          id: order.id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          currentPaymentStatus: order.paymentStatus,
          correctStatus,
          correctPaymentStatus,
          totalOrder,
          totalPaid,
          paymentCount: order.payments.length,
          needsStatusCorrection,
          needsPaymentStatusCorrection
        })
      } else {
        alreadyCorrect++
      }
    }

    console.log(`✅ Commandes déjà correctes: ${alreadyCorrect}`)
    console.log(`🔧 Commandes à corriger: ${corrections.length}`)
    console.log('')

    if (corrections.length === 0) {
      console.log('🎉 Aucune correction nécessaire!')
      return
    }

    // Afficher les corrections à effectuer
    console.log('📋 CORRECTIONS À EFFECTUER:')
    console.log('')
    
    corrections.forEach((correction, index) => {
      console.log(`${index + 1}. ${correction.orderNumber || correction.id}`)
      console.log(`   Total: ${correction.totalOrder.toLocaleString()} Ar`)
      console.log(`   Payé: ${correction.totalPaid.toLocaleString()} Ar`)
      console.log(`   Paiements: ${correction.paymentCount}`)
      
      if (correction.needsStatusCorrection) {
        console.log(`   Status: ${correction.currentStatus} → ${correction.correctStatus}`)
      }
      if (correction.needsPaymentStatusCorrection) {
        console.log(`   PaymentStatus: ${correction.currentPaymentStatus} → ${correction.correctPaymentStatus}`)
      }
      console.log('')
    })

    // Demander confirmation (simulée)
    console.log('🚀 APPLICATION DES CORRECTIONS...')
    console.log('')

    let correctedCount = 0
    let historyEntries = []

    for (const correction of corrections) {
      try {
        // Préparer les données de mise à jour
        const updateData = {}
        if (correction.needsStatusCorrection) {
          updateData.status = correction.correctStatus
        }
        if (correction.needsPaymentStatusCorrection) {
          updateData.paymentStatus = correction.correctPaymentStatus
        }

        // Mettre à jour la commande
        await prisma.order.update({
          where: { id: correction.id },
          data: updateData
        })

        console.log(`✅ ${correction.orderNumber || correction.id}: Corrigé`)
        correctedCount++

        // Préparer l'entrée d'historique
        let description = 'Correction automatique des statuts: '
        const changes = []
        if (correction.needsStatusCorrection) {
          changes.push(`status ${correction.currentStatus} → ${correction.correctStatus}`)
        }
        if (correction.needsPaymentStatusCorrection) {
          changes.push(`paymentStatus ${correction.currentPaymentStatus} → ${correction.correctPaymentStatus}`)
        }
        description += changes.join(', ')

        historyEntries.push({
          orderId: correction.id,
          status: correction.correctStatus,
          previousStatus: correction.currentStatus,
          action: 'STATUS_CORRECTION',
          description: description,
          userId: null // Correction automatique
        })

      } catch (error) {
        console.error(`❌ Erreur pour ${correction.orderNumber || correction.id}:`, error.message)
      }
    }

    // Créer les entrées d'historique
    if (historyEntries.length > 0) {
      try {
        await prisma.orderHistory.createMany({
          data: historyEntries
        })
        console.log(`📝 ${historyEntries.length} entrées d'historique créées`)
      } catch (error) {
        console.error('❌ Erreur lors de la création de l\'historique:', error.message)
      }
    }

    console.log('')
    console.log(`🎉 CORRECTION TERMINÉE!`)
    console.log(`   • ${correctedCount} commandes corrigées`)
    console.log(`   • ${historyEntries.length} entrées d'historique créées`)
    console.log('')

    // Vérification finale
    console.log('🔍 VÉRIFICATION FINALE...')
    const finalCheck = await prisma.order.findMany({
      include: {
        payments: {
          where: { status: 'COMPLETED' }
        }
      }
    })

    let stillIncorrect = 0
    for (const order of finalCheck) {
      const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalOrder = Number(order.total)
      
      let expectedStatus
      if (totalPaid === 0) {
        expectedStatus = 'PENDING'
      } else if (totalPaid >= totalOrder) {
        const advancedStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED']
        expectedStatus = advancedStatuses.includes(order.status) ? order.status : 'PAID'
      } else {
        expectedStatus = 'PARTIALLY_PAID'
      }

      if (order.status !== expectedStatus) {
        stillIncorrect++
      }
    }

    if (stillIncorrect === 0) {
      console.log('✅ Tous les statuts sont maintenant corrects!')
    } else {
      console.log(`⚠️ ${stillIncorrect} commandes ont encore des problèmes`)
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPaymentStatuses()
