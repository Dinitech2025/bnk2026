const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createInitialOrderHistory() {
  console.log('🔄 Création de l\'historique initial pour les commandes existantes...')
  
  try {
    // Récupérer toutes les commandes qui n'ont pas d'historique
    const ordersWithoutHistory = await prisma.order.findMany({
      where: {
        history: {
          none: {}
        }
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log(`📊 ${ordersWithoutHistory.length} commandes trouvées sans historique`)

    if (ordersWithoutHistory.length === 0) {
      console.log('✅ Toutes les commandes ont déjà un historique')
      return
    }

    // Créer l'historique initial pour chaque commande
    const historyEntries = []

    for (const order of ordersWithoutHistory) {
      // Entrée de création
      historyEntries.push({
        orderId: order.id,
        status: 'PENDING', // Statut initial supposé
        previousStatus: null,
        action: 'CREATED',
        description: 'Commande créée',
        createdAt: order.createdAt
      })

      // Si le statut actuel n'est pas PENDING, ajouter une entrée de changement
      if (order.status !== 'PENDING') {
        historyEntries.push({
          orderId: order.id,
          status: order.status,
          previousStatus: 'PENDING',
          action: 'STATUS_CHANGE',
          description: `Statut changé de "PENDING" vers "${order.status}"`,
          createdAt: order.updatedAt
        })
      }
    }

    console.log(`📝 Création de ${historyEntries.length} entrées d'historique...`)

    // Insérer toutes les entrées d'historique
    await prisma.orderHistory.createMany({
      data: historyEntries
    })

    console.log('✅ Historique initial créé avec succès!')
    
    // Vérification
    const totalHistory = await prisma.orderHistory.count()
    console.log(`📊 Total des entrées d'historique: ${totalHistory}`)

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'historique initial:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createInitialOrderHistory()
