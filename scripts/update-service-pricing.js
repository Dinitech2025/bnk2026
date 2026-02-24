const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateServicePricing() {
  console.log('🔧 Mise à jour des types de tarification des services...\n')

  try {
    // Services à mettre à jour avec différents types de tarification
    const updates = [
      {
        slug: 'consultation-gratuite',
        pricingType: 'FIXED',
        requiresQuote: false,
      },
      {
        slug: 'maintenance-ordinateur-standard',
        pricingType: 'FIXED',
        requiresQuote: false,
      },
      {
        slug: 'formation-bureautique-complete',
        pricingType: 'FIXED',
        requiresQuote: false,
      },
      {
        slug: 'support-express',
        pricingType: 'FIXED',
        requiresQuote: false,
      },
      {
        slug: 'installation-reseau-pro',
        pricingType: 'NEGOTIABLE',
        requiresQuote: true,
        autoAcceptNegotiation: false,
      },
      {
        slug: 'migration-cloud-entreprise',
        pricingType: 'NEGOTIABLE',
        requiresQuote: true,
        autoAcceptNegotiation: false,
      },
      {
        slug: 'audit-securite-complet',
        pricingType: 'QUOTE_REQUIRED',
        requiresQuote: true,
      },
      {
        slug: 'diagnostic-express',
        pricingType: 'FIXED',
        requiresQuote: false,
      },
      {
        slug: 'developpement-app-web',
        pricingType: 'QUOTE_REQUIRED',
        requiresQuote: true,
      },
      {
        slug: 'pack-maintenance-premium',
        pricingType: 'FIXED',
        requiresQuote: false,
      },
      {
        slug: 'formation-personnalisee',
        pricingType: 'RANGE',
        requiresQuote: true,
        minPrice: 150000,
        maxPrice: 400000,
      },
      {
        slug: 'maintenance-preventive',
        pricingType: 'NEGOTIABLE',
        requiresQuote: false,
        autoAcceptNegotiation: true,
      },
    ]

    console.log(`📋 Mise à jour de ${updates.length} services...\n`)

    let updatedCount = 0
    let errorCount = 0

    for (const update of updates) {
      try {
        const { minPrice, maxPrice, ...updateData } = update

        // Mise à jour du service
        const service = await prisma.service.update({
          where: { slug: update.slug },
          data: {
            ...updateData,
            ...(minPrice && { minPrice }),
            ...(maxPrice && { maxPrice }),
            updatedAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            slug: true,
            pricingType: true,
            requiresQuote: true,
            minPrice: true,
            maxPrice: true,
            autoAcceptNegotiation: true,
          }
        })

        console.log(`✅ ${service.name}`)
        console.log(`   💰 Type: ${service.pricingType}`)
        console.log(`   📝 Devis: ${service.requiresQuote ? 'Requis' : 'Non requis'}`)
        if (service.minPrice && service.maxPrice) {
          console.log(`   💵 Fourchette: ${Number(service.minPrice).toLocaleString('fr-FR')} - ${Number(service.maxPrice).toLocaleString('fr-FR')} Ar`)
        }
        if (service.autoAcceptNegotiation !== undefined) {
          console.log(`   🤝 Auto-acceptation: ${service.autoAcceptNegotiation ? 'Oui' : 'Non'}`)
        }

        updatedCount++
      } catch (error) {
        console.error(`❌ Erreur avec ${update.slug}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 Résumé:`)
    console.log(`   ✅ ${updatedCount} services mis à jour`)
    console.log(`   ❌ ${errorCount} erreurs`)

    if (updatedCount > 0) {
      console.log(`\n🎯 Types de tarification disponibles:`)
      console.log(`   🔒 FIXED: Prix fixe, pas de négociation`)
      console.log(`   💬 NEGOTIABLE: Prix négociable, client peut proposer`)
      console.log(`   📋 QUOTE_REQUIRED: Devis obligatoire avant commande`)
      console.log(`   📊 RANGE: Fourchette de prix selon complexité`)

      console.log(`\n💡 Testez maintenant:`)
      console.log(`   📋 Allez sur /admin/services`)
      console.log(`   🛒 Testez l'ajout au panier`)
      console.log(`   📝 Créez des devis pour les services qui nécessitent un devis`)
      console.log(`   💰 Vérifiez les options de négociation`)
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateServicePricing()

