const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updatePricesToAriary() {
  console.log('💰 Mise à jour des prix en Ariary (MGA)...')

  // Conversion approximative EUR -> MGA (1 EUR = ~4500 MGA)
  const EUR_TO_MGA = 4500

  // 1. Mettre à jour les produits
  console.log('\n📱 Mise à jour des prix des produits...')
  
  const products = await prisma.product.findMany()
  
  for (const product of products) {
    const currentPriceEUR = parseFloat(product.price)
    const newPriceMGA = Math.round(currentPriceEUR * EUR_TO_MGA)
    
    await prisma.product.update({
      where: { id: product.id },
      data: { 
        price: newPriceMGA,
        compareAtPrice: product.compareAtPrice ? Math.round(parseFloat(product.compareAtPrice) * EUR_TO_MGA) : null
      }
    })
    
    console.log(`✅ ${product.name}: ${currentPriceEUR}€ → ${newPriceMGA.toLocaleString()} Ar`)
  }

  // 2. Mettre à jour les services
  console.log('\n🔧 Mise à jour des prix des services...')
  
  const services = await prisma.service.findMany()
  
  for (const service of services) {
    const currentPriceEUR = parseFloat(service.price)
    const newPriceMGA = currentPriceEUR > 0 ? Math.round(currentPriceEUR * EUR_TO_MGA) : 0
    
    const updateData = {
      price: newPriceMGA,
      minPrice: service.minPrice ? Math.round(parseFloat(service.minPrice) * EUR_TO_MGA) : null,
      maxPrice: service.maxPrice ? Math.round(parseFloat(service.maxPrice) * EUR_TO_MGA) : null
    }
    
    await prisma.service.update({
      where: { id: service.id },
      data: updateData
    })
    
    if (currentPriceEUR > 0) {
      console.log(`✅ ${service.name}: ${currentPriceEUR}€ → ${newPriceMGA.toLocaleString()} Ar`)
    } else {
      console.log(`✅ ${service.name}: Sur devis (prix maintenu à 0)`)
    }
    
    if (service.minPrice && service.maxPrice) {
      const minMGA = Math.round(parseFloat(service.minPrice) * EUR_TO_MGA)
      const maxMGA = Math.round(parseFloat(service.maxPrice) * EUR_TO_MGA)
      console.log(`   └── Gamme: ${minMGA.toLocaleString()} - ${maxMGA.toLocaleString()} Ar`)
    }
  }

  console.log('\n🎉 Tous les prix ont été convertis en Ariary (MGA) !')
  console.log('📊 Taux de conversion utilisé: 1 EUR = 4,500 Ar')
}

updatePricesToAriary()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
