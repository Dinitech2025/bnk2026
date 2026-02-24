const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function forceTestSlidesAPI() {
  try {
    console.log('🔍 Test direct de la DB pour slides...')
    
    // Test direct sans passer par l'API
    const allSlides = await prisma.heroSlide.findMany()
    console.log(`📊 Total slides en DB: ${allSlides.length}`)
    
    const activeSlides = await prisma.heroSlide.findMany({
      where: { isActive: true }
    })
    console.log(`✅ Slides actifs: ${activeSlides.length}`)
    
    if (allSlides.length > 0) {
      console.log('\n📋 Détail des slides:')
      allSlides.forEach((slide, index) => {
        console.log(`${index + 1}. "${slide.title}" (actif: ${slide.isActive}, ordre: ${slide.order})`)
      })
    }
    
    // Forcer l'activation de tous les slides si nécessaire
    if (activeSlides.length === 0 && allSlides.length > 0) {
      console.log('\n🔧 Activation de tous les slides...')
      await prisma.heroSlide.updateMany({
        data: { isActive: true }
      })
      console.log('✅ Tous les slides activés')
    }
    
    // Re-tester
    const finalActiveSlides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    console.log(`\n🎯 Résultat final: ${finalActiveSlides.length} slides actifs`)
    
    if (finalActiveSlides.length > 0) {
      console.log('📤 Simulation réponse API:')
      console.log(JSON.stringify(finalActiveSlides.map(s => ({
        id: s.id,
        title: s.title,
        isActive: s.isActive,
        order: s.order
      })), null, 2))
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

forceTestSlidesAPI()
