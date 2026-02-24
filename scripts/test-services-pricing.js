const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testServicesPricing() {
  try {
    console.log('🧪 Test des services avec types de pricing...')

    // Test 1: Récupérer tous les services avec leurs types
    const allServices = await prisma.service.findMany({
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`\n📋 Services trouvés: ${allServices.length}`)
    
    allServices.forEach(service => {
      console.log(`\n🔹 ${service.name}`)
      console.log(`   Type: ${service.pricingType}`)
      console.log(`   Prix: ${service.price}`)
      console.log(`   Durée: ${service.duration} min`)
      console.log(`   Nécessite devis: ${service.requiresQuote ? 'Oui' : 'Non'}`)
      
      if (service.pricingType === 'RANGE') {
        console.log(`   Fourchette: ${service.minPrice} - ${service.maxPrice}`)
      }
      
      if (service.pricingType === 'NEGOTIABLE') {
        console.log(`   Négociation auto: ${service.autoAcceptNegotiation ? 'Oui' : 'Non'}`)
        if (service.minPrice || service.maxPrice) {
          console.log(`   Limites: ${service.minPrice || 'N/A'} - ${service.maxPrice || 'N/A'}`)
        }
      }
    })

    // Test 2: Services nécessitant un devis
    const quoteRequiredServices = await prisma.service.findMany({
      where: {
        OR: [
          { pricingType: 'QUOTE_REQUIRED' },
          { requiresQuote: true }
        ]
      }
    })

    console.log(`\n📝 Services nécessitant un devis: ${quoteRequiredServices.length}`)
    quoteRequiredServices.forEach(service => {
      console.log(`   - ${service.name} (${service.pricingType})`)
    })

    // Test 3: Services avec négociation
    const negotiableServices = await prisma.service.findMany({
      where: {
        pricingType: 'NEGOTIABLE'
      }
    })

    console.log(`\n🤝 Services négociables: ${negotiableServices.length}`)
    negotiableServices.forEach(service => {
      console.log(`   - ${service.name} (Auto: ${service.autoAcceptNegotiation ? 'Oui' : 'Non'})`)
    })

    // Test 4: Services avec fourchette de prix
    const rangeServices = await prisma.service.findMany({
      where: {
        pricingType: 'RANGE'
      }
    })

    console.log(`\n💰 Services avec fourchette: ${rangeServices.length}`)
    rangeServices.forEach(service => {
      console.log(`   - ${service.name}: ${service.minPrice} - ${service.maxPrice}`)
    })

    // Test 5: Vérifier la cohérence des données
    console.log(`\n🔍 Vérification de la cohérence...`)
    
    const inconsistentServices = allServices.filter(service => {
      // Services QUOTE_REQUIRED doivent avoir requiresQuote = true
      if (service.pricingType === 'QUOTE_REQUIRED' && !service.requiresQuote) {
        return true
      }
      
      // Services RANGE doivent avoir minPrice et maxPrice
      if (service.pricingType === 'RANGE' && (!service.minPrice || !service.maxPrice)) {
        return true
      }
      
      return false
    })

    if (inconsistentServices.length > 0) {
      console.log(`⚠️  Services incohérents trouvés: ${inconsistentServices.length}`)
      inconsistentServices.forEach(service => {
        console.log(`   - ${service.name}: ${service.pricingType}`)
      })
    } else {
      console.log(`✅ Tous les services sont cohérents`)
    }

    console.log('\n🎉 Test terminé avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  testServicesPricing()
}

module.exports = { testServicesPricing } 