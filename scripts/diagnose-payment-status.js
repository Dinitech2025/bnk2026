const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnosePaymentStatus() {
  console.log('🔍 DIAGNOSTIC DES STATUTS DE PAIEMENT')
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 ANALYSE DE ${orders.length} COMMANDES:`)
    console.log('')

    let problemOrders = []
    let correctOrders = 0

    for (const order of orders) {
      const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const totalOrder = Number(order.total)
      const remaining = totalOrder - totalPaid

      // Déterminer le statut attendu
      let expectedStatus
      if (totalPaid === 0) {
        expectedStatus = 'PENDING'
      } else if (totalPaid >= totalOrder) {
        expectedStatus = 'PAID'
      } else {
        expectedStatus = 'PARTIALLY_PAID'
      }

      // Vérifier si le statut actuel est correct
      const isCorrect = order.status === expectedStatus
      
      if (!isCorrect) {
        problemOrders.push({
          id: order.id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          expectedStatus,
          totalOrder,
          totalPaid,
          remaining,
          paymentCount: order.payments.length
        })
      } else {
        correctOrders++
      }
    }

    console.log(`✅ Commandes correctes: ${correctOrders}`)
    console.log(`❌ Commandes avec problème: ${problemOrders.length}`)
    console.log('')

    if (problemOrders.length > 0) {
      console.log('🚨 COMMANDES AVEC STATUT INCORRECT:')
      console.log('')
      
      problemOrders.forEach((order, index) => {
        console.log(`${index + 1}. Commande: ${order.orderNumber || order.id}`)
        console.log(`   Total: ${order.totalOrder.toLocaleString()} Ar`)
        console.log(`   Payé: ${order.totalPaid.toLocaleString()} Ar`)
        console.log(`   Restant: ${order.remaining.toLocaleString()} Ar`)
        console.log(`   Paiements: ${order.paymentCount}`)
        console.log(`   Statut actuel: ${order.currentStatus}`)
        console.log(`   Statut attendu: ${order.expectedStatus}`)
        console.log('')
      })

      // Grouper par type de problème
      const problemsByType = problemOrders.reduce((acc, order) => {
        const key = `${order.currentStatus} → ${order.expectedStatus}`
        if (!acc[key]) acc[key] = []
        acc[key].push(order)
        return acc
      }, {})

      console.log('📈 RÉPARTITION DES PROBLÈMES:')
      Object.entries(problemsByType).forEach(([type, orders]) => {
        console.log(`   • ${type}: ${orders.length} commandes`)
      })
      console.log('')
    }

    // 2. Analyser les statuts de paiement (paymentStatus)
    console.log('💳 ANALYSE DES STATUTS DE PAIEMENT (paymentStatus):')
    console.log('')

    const paymentStatusCounts = await prisma.order.groupBy({
      by: ['paymentStatus'],
      _count: {
        paymentStatus: true
      }
    })

    paymentStatusCounts.forEach(item => {
      console.log(`   • ${item.paymentStatus}: ${item._count.paymentStatus} commandes`)
    })
    console.log('')

    // 3. Vérifier la cohérence entre status et paymentStatus
    console.log('🔄 COHÉRENCE STATUS vs PAYMENT_STATUS:')
    console.log('')

    const incoherentOrders = await prisma.order.findMany({
      where: {
        OR: [
          // Status PAID mais paymentStatus pas PAID
          {
            status: 'PAID',
            paymentStatus: { not: 'PAID' }
          },
          // Status PARTIALLY_PAID mais paymentStatus pas PARTIALLY_PAID
          {
            status: 'PARTIALLY_PAID',
            paymentStatus: { not: 'PARTIALLY_PAID' }
          },
          // Status PENDING mais paymentStatus pas PENDING
          {
            status: 'PENDING',
            paymentStatus: { not: 'PENDING' }
          }
        ]
      },
      include: {
        payments: {
          where: { status: 'COMPLETED' }
        }
      }
    })

    if (incoherentOrders.length > 0) {
      console.log(`❌ ${incoherentOrders.length} commandes avec incohérence status/paymentStatus:`)
      console.log('')
      
      incoherentOrders.forEach((order, index) => {
        const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        console.log(`${index + 1}. ${order.orderNumber || order.id}`)
        console.log(`   Status: ${order.status}`)
        console.log(`   PaymentStatus: ${order.paymentStatus}`)
        console.log(`   Total: ${Number(order.total).toLocaleString()} Ar`)
        console.log(`   Payé: ${totalPaid.toLocaleString()} Ar`)
        console.log('')
      })
    } else {
      console.log('✅ Tous les statuts sont cohérents')
    }

    console.log('')
    console.log('🎯 RECOMMANDATIONS:')
    console.log('')
    
    if (problemOrders.length > 0) {
      console.log('1. Exécuter le script de correction des statuts')
      console.log('2. Vérifier la logique de calcul dans l\'API payments')
      console.log('3. Mettre à jour les commandes problématiques')
    } else {
      console.log('✅ Aucune correction nécessaire')
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnosePaymentStatus()
