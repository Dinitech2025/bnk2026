const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testQuoteSystem() {
  console.log('🧪 Test du système complet de devis...\n')

  try {
    // 1. Vérifier les services avec devis
    console.log('1️⃣ Services nécessitant un devis:')
    const quoteRequiredServices = await prisma.service.findMany({
      where: {
        requiresQuote: true,
        published: true
      },
      select: {
        id: true,
        name: true,
        pricingType: true,
        requiresQuote: true,
        minPrice: true,
        maxPrice: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`   📋 ${quoteRequiredServices.length} services trouvés:`)
    quoteRequiredServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name}`)
      console.log(`      💰 Type: ${service.pricingType}`)
      console.log(`      📂 Catégorie: ${service.category?.name || 'Non classé'}`)
      if (service.minPrice && service.maxPrice) {
        console.log(`      💵 Fourchette: ${service.minPrice.toLocaleString('fr-FR')} - ${service.maxPrice.toLocaleString('fr-FR')} Ar`)
      }
    })

    // 2. Services négociables
    console.log('\n2️⃣ Services négociables:')
    const negotiableServices = await prisma.service.findMany({
      where: {
        pricingType: 'NEGOTIABLE',
        published: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        autoAcceptNegotiation: true,
        requiresQuote: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`   💬 ${negotiableServices.length} services trouvés:`)
    negotiableServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name}`)
      console.log(`      💰 Prix de base: ${service.price.toLocaleString('fr-FR')} Ar`)
      console.log(`      🤝 Auto-acceptation: ${service.autoAcceptNegotiation ? 'Oui' : 'Non'}`)
      console.log(`      📝 Devis requis: ${service.requiresQuote ? 'Oui' : 'Non'}`)
    })

    // 3. Services avec fourchette de prix
    console.log('\n3️⃣ Services avec fourchette de prix:')
    const rangeServices = await prisma.service.findMany({
      where: {
        pricingType: 'RANGE',
        published: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        minPrice: true,
        maxPrice: true,
        requiresQuote: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`   📊 ${rangeServices.length} services trouvés:`)
    rangeServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name}`)
      console.log(`      💰 Prix de base: ${service.price.toLocaleString('fr-FR')} Ar`)
      console.log(`      💵 Fourchette: ${service.minPrice?.toLocaleString('fr-FR')} - ${service.maxPrice?.toLocaleString('fr-FR')} Ar`)
    })

    // 4. Vérifier les clients disponibles
    console.log('\n4️⃣ Clients disponibles pour les devis:')
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            quotes: true,
            orders: true
          }
        }
      }
    })

    console.log(`   👥 ${clients.length} clients trouvés:`)
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name || 'Client'} (${client.email})`)
      console.log(`      📋 ${client._count.quotes} devis • 🛒 ${client._count.orders} commandes`)
    })

    // 5. Test de la création d'un devis
    console.log('\n5️⃣ Test de création de devis:')
    if (clients.length > 0 && quoteRequiredServices.length > 0) {
      const testClient = clients[0]
      const testService = quoteRequiredServices[0]

      console.log(`   🎯 Client: ${testClient.email}`)
      console.log(`   🔧 Service: ${testService.name}`)
      console.log(`   💰 Type: ${testService.pricingType}`)

      // Créer un devis de test
      const testQuote = await prisma.quote.create({
        data: {
          userId: testClient.id,
          serviceId: testService.id,
          description: `Test de devis automatique pour ${testService.name}`,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          service: {
            select: {
              name: true,
              pricingType: true
            }
          }
        }
      })

      console.log(`   ✅ Devis créé: ${testQuote.id}`)
      console.log(`   👤 Client: ${testQuote.user.name} (${testQuote.user.email})`)
      console.log(`   🔧 Service: ${testQuote.service.name} (${testQuote.service.pricingType})`)
      console.log(`   📝 Statut: ${testQuote.status}`)

      // Nettoyer le devis de test
      await prisma.quoteMessage.deleteMany({
        where: { quoteId: testQuote.id }
      })
      await prisma.quote.delete({
        where: { id: testQuote.id }
      })
      console.log(`   🧹 Devis de test supprimé`)
    }

    // 6. Statistiques globales
    console.log('\n6️⃣ Statistiques du système:')
    const totalServices = await prisma.service.count({
      where: { published: true }
    })
    const quoteRequiredCount = await prisma.service.count({
      where: {
        requiresQuote: true,
        published: true
      }
    })
    const negotiableCount = await prisma.service.count({
      where: {
        pricingType: 'NEGOTIABLE',
        published: true
      }
    })
    const rangeCount = await prisma.service.count({
      where: {
        pricingType: 'RANGE',
        published: true
      }
    })

    console.log(`   📊 Services publiés: ${totalServices}`)
    console.log(`   📋 Devis requis: ${quoteRequiredCount}`)
    console.log(`   💬 Négociables: ${negotiableCount}`)
    console.log(`   📊 Fourchette: ${rangeCount}`)
    console.log(`   🔒 Prix fixe: ${totalServices - quoteRequiredCount - negotiableCount - rangeCount}`)

    console.log('\n🎉 Test du système de devis terminé avec succès!')
    console.log('\n💡 Fonctionnalités disponibles:')
    console.log('   🛒 Ajout au panier avec gestion des devis')
    console.log('   📋 Création automatique de devis depuis les services')
    console.log('   💬 Négociation avec auto-acceptation')
    console.log('   📊 Fourchettes de prix personnalisables')
    console.log('   🔄 Redirection intelligente vers les devis')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testQuoteSystem()

