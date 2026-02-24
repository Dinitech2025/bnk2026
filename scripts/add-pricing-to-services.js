const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addPricingToServices() {
  try {
    console.log('🔄 Ajout des champs de pricing aux services...')

    // Récupérer tous les services
    const services = await prisma.service.findMany()
    
    console.log(`📋 ${services.length} services trouvés`)

    // Mettre à jour chaque service avec des valeurs par défaut
    for (const service of services) {
      let pricingType = 'FIXED'
      let requiresQuote = false
      let autoAcceptNegotiation = false
      let minPrice = null
      let maxPrice = null

      // Logique pour déterminer le type de pricing basé sur le nom ou le prix
      if (service.name.toLowerCase().includes('sur mesure') || 
          service.name.toLowerCase().includes('personnalis') ||
          service.name.toLowerCase().includes('projet')) {
        pricingType = 'QUOTE_REQUIRED'
        requiresQuote = true
      } else if (service.price > 100000) {
        pricingType = 'NEGOTIABLE'
        autoAcceptNegotiation = true
        minPrice = service.price * 0.8 // 20% de réduction max
        maxPrice = service.price * 1.2 // 20% d'augmentation max
      } else if (service.price > 50000) {
        pricingType = 'RANGE'
        minPrice = service.price * 0.9 // 10% de réduction max
        maxPrice = service.price * 1.1 // 10% d'augmentation max
      }

      await prisma.service.update({
        where: { id: service.id },
        data: {
          pricingType,
          requiresQuote,
          autoAcceptNegotiation,
          minPrice,
          maxPrice
        }
      })

      console.log(`✅ ${service.name}: ${pricingType}${minPrice ? ` (${minPrice}-${maxPrice})` : ''}`)
    }

    console.log('✨ Mise à jour terminée !')

    // Afficher un résumé
    const summary = await prisma.service.groupBy({
      by: ['pricingType'],
      _count: {
        id: true
      }
    })

    console.log('\n📊 Résumé par type de pricing:')
    summary.forEach(group => {
      console.log(`  ${group.pricingType}: ${group._count.id} services`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addPricingToServices() 