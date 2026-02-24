const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixQuoteStatus() {
  try {
    console.log('🔧 CORRECTION DU STATUT QUOTE → PENDING')
    console.log('')
    
    // 1. Trouver toutes les commandes avec le statut QUOTE
    const quoteOrders = await prisma.order.findMany({
      where: { status: 'QUOTE' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log(`📦 ${quoteOrders.length} commandes avec statut QUOTE trouvées:`)
    quoteOrders.forEach(order => {
      console.log(`   • ${order.orderNumber} (${order.id.substring(0, 8)}) - Créée: ${order.createdAt.toISOString().split('T')[0]}`)
    })
    console.log('')
    
    if (quoteOrders.length === 0) {
      console.log('✅ Aucune commande QUOTE à corriger')
      return
    }
    
    // 2. Corriger chaque commande QUOTE → PENDING
    console.log('🔄 Correction en cours...')
    
    for (const order of quoteOrders) {
      try {
        // Mettre à jour le statut dans une transaction
        const [updatedOrder] = await prisma.$transaction([
          // Mettre à jour le statut
          prisma.order.update({
            where: { id: order.id },
            data: { 
              status: 'PENDING',
              updatedAt: new Date()
            }
          }),
          // Ajouter l'entrée dans l'historique
          prisma.orderHistory.create({
            data: {
              orderId: order.id,
              status: 'PENDING',
              previousStatus: 'QUOTE',
              action: 'STATUS_CORRECTION',
              description: 'Correction automatique: QUOTE → PENDING (En attente)',
              userId: null // Correction automatique
            }
          })
        ])
        
        console.log(`   ✅ ${order.orderNumber}: QUOTE → PENDING`)
        
      } catch (error) {
        console.log(`   ❌ Erreur pour ${order.orderNumber}: ${error.message}`)
      }
    }
    
    console.log('')
    console.log('🎯 VÉRIFICATION POST-CORRECTION:')
    
    // 3. Vérifier qu'il n'y a plus de commandes QUOTE
    const remainingQuotes = await prisma.order.count({
      where: { status: 'QUOTE' }
    })
    
    console.log(`   📊 Commandes QUOTE restantes: ${remainingQuotes}`)
    
    // 4. Compter les commandes PENDING
    const pendingCount = await prisma.order.count({
      where: { status: 'PENDING' }
    })
    
    console.log(`   📊 Commandes PENDING: ${pendingCount}`)
    
    console.log('')
    console.log('📋 STATUTS VALIDES DANS LE SYSTÈME:')
    console.log('   • PENDING (En attente)')
    console.log('   • PAID (Payée)')
    console.log('   • PROCESSING (En cours)')
    console.log('   • SHIPPED (Expédiée)')
    console.log('   • DELIVERED (Livrée)')
    console.log('   • CANCELLED (Annulée)')
    console.log('   • REFUNDED (Remboursée)')
    console.log('')
    
    console.log('✅ CORRECTION TERMINÉE!')
    console.log('')
    console.log('🔄 Maintenant, actualisez la page de la commande DEV-2025-0006')
    console.log('   Elle devrait afficher "En attente" au lieu de "QUOTE"')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixQuoteStatus()
