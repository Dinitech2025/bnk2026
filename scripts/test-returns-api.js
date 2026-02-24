const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testReturnsAPI() {
  try {
    console.log('🔍 Test de l\'API des retours...')

    // Trouver une commande avec des retours
    const orderWithReturns = await prisma.order.findFirst({
      where: {
        returns: {
          some: {}
        }
      },
      include: {
        returns: {
          include: {
            returnItems: {
              include: {
                orderItem: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    service: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!orderWithReturns) {
      console.log('❌ Aucune commande avec retours trouvée')
      return
    }

    console.log(`📦 Commande: ${orderWithReturns.orderNumber}`)
    console.log(`🔄 Retours: ${orderWithReturns.returns.length}`)

    orderWithReturns.returns.forEach((returnItem, index) => {
      console.log(`\n📋 Retour ${index + 1}: ${returnItem.returnNumber}`)
      console.log(`   Statut: ${returnItem.status}`)
      console.log(`   Articles retournés: ${returnItem.returnItems?.length || 0}`)
      
      if (returnItem.returnItems && returnItem.returnItems.length > 0) {
        returnItem.returnItems.forEach((item, itemIndex) => {
          const orderItem = item.orderItem
          let itemName = 'Article inconnu'
          
          if (orderItem.product?.name) {
            itemName = orderItem.product.name
          } else if (orderItem.service?.name) {
            itemName = orderItem.service.name
          } else if (orderItem.metadata) {
            try {
              const metadata = typeof orderItem.metadata === 'string' 
                ? JSON.parse(orderItem.metadata) 
                : orderItem.metadata
              itemName = metadata?.name || 'Article inconnu'
            } catch (e) {
              console.log(`     ⚠️ Erreur parsing metadata: ${e.message}`)
            }
          }
          
          console.log(`     ${itemIndex + 1}. ${itemName} (x${item.quantity}) - ${item.refundAmount.toLocaleString()} Ar`)
          console.log(`        OrderItem ID: ${orderItem.id}`)
          console.log(`        Metadata: ${JSON.stringify(orderItem.metadata)}`)
        })
      } else {
        console.log('     ⚠️ Aucun returnItems ou tableau vide')
      }
    })

    // Test de l'API HTTP
    console.log('\n🌐 Test de l\'API HTTP...')
    const fetch = (await import('node-fetch')).default
    
    try {
      const response = await fetch(`http://localhost:3000/api/admin/orders/${orderWithReturns.id}`)
      const data = await response.json()
      
      console.log(`📡 Statut API: ${response.status}`)
      console.log(`🔄 Retours dans API: ${data.returns?.length || 0}`)
      
      if (data.returns && data.returns.length > 0) {
        const firstReturn = data.returns[0]
        console.log(`📋 Premier retour API:`)
        console.log(`   returnItems: ${firstReturn.returnItems?.length || 0}`)
        
        if (firstReturn.returnItems && firstReturn.returnItems.length > 0) {
          const firstItem = firstReturn.returnItems[0]
          console.log(`   Premier item orderItem:`, JSON.stringify(firstItem.orderItem, null, 2))
        }
      }
      
    } catch (apiError) {
      console.error('❌ Erreur API HTTP:', apiError.message)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testReturnsAPI()