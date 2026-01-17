import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestQuoteWithProposals() {
  try {
    console.log('🚀 Création d\'un devis de test avec cycle complet de propositions...\n')

    // 1. Trouver un utilisateur client
    let testUser = await prisma.user.findFirst({
      where: { email: 'client@test.com' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'client@test.com',
          name: 'Client Test',
          password: 'test',
          role: 'CLIENT'
        }
      })
      console.log('✅ Utilisateur créé:', testUser.email)
    }

    // 2. Trouver un produit
    const testProduct = await prisma.product.findFirst({
      where: { pricingType: 'NEGOTIABLE' }
    })

    if (!testProduct) {
      console.log('❌ Aucun produit négociable trouvé')
      return
    }

    // 3. Trouver un admin
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'STAFF'] } }
    })

    if (!adminUser) {
      console.log('❌ Aucun admin trouvé')
      return
    }

    // 4. Créer le devis
    const quote = await prisma.quote.create({
      data: {
        userId: testUser.id,
        productId: testProduct.id,
        description: `Test cycle complet - ${testProduct.name}`,
        budget: 45000,
        status: 'PENDING',
        negotiationType: 'PRODUCT_PRICE'
      }
    })
    console.log('✅ Devis créé:', quote.id)

    // 5. Créer les messages avec propositions
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Message 1: Demande initiale
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: testUser.id,
        message: 'Bonjour, je souhaite acheter ce produit. Mon budget est de 45,000 Ar.',
        proposedPrice: null
      }
    })
    console.log('✅ Message 1 - Demande initiale')
    await delay(500)

    // Message 2: Proposition client 1
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'NEGOTIATING', proposedPrice: 42000 }
    })
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: testUser.id,
        message: 'Je propose 42,000 Ar.',
        proposedPrice: 42000
      }
    })
    console.log('✅ Message 2 - Proposition client: 42,000 Ar')
    await delay(500)

    // Message 3: Contre-proposition admin 1
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'PRICE_PROPOSED', proposedPrice: 47000 }
    })
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: adminUser.id,
        message: 'Nous proposons 47,000 Ar.',
        proposedPrice: 47000
      }
    })
    console.log('✅ Message 3 - Contre-proposition admin: 47,000 Ar')
    await delay(500)

    // Message 4: Proposition client 2
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'NEGOTIATING', proposedPrice: 44000 }
    })
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: testUser.id,
        message: 'Je peux monter à 44,000 Ar.',
        proposedPrice: 44000
      }
    })
    console.log('✅ Message 4 - Proposition client: 44,000 Ar')
    await delay(500)

    // Message 5: Contre-proposition admin 2
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'PRICE_PROPOSED', proposedPrice: 46000 }
    })
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: adminUser.id,
        message: 'Notre meilleure offre: 46,000 Ar.',
        proposedPrice: 46000
      }
    })
    console.log('✅ Message 5 - Contre-proposition admin: 46,000 Ar')
    await delay(500)

    // Message 6: Proposition client 3 (limite atteinte)
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'NEGOTIATING', proposedPrice: 45500 }
    })
    await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: testUser.id,
        message: 'Dernière proposition: 45,500 Ar.',
        proposedPrice: 45500
      }
    })
    console.log('✅ Message 6 - Proposition client: 45,500 Ar (limite atteinte)')

    console.log('\n📊 Résumé:')
    console.log(`   - Devis ID: ${quote.id}`)
    console.log('   - Budget: 45,000 Ar')
    console.log(`   - Prix produit: ${testProduct.price} Ar`)
    console.log('   - 3 propositions créées')
    console.log('\n✅ Cycle complet créé avec succès!')
    console.log(`\n🔗 Voir dans l'admin: /admin/messages`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestQuoteWithProposals()


