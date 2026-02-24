const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHeroSlides() {
  try {
    console.log('🔍 Vérification des slides héro...')
    
    // Récupérer tous les slides
    const allSlides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' }
    })
    
    console.log(`📊 Total slides trouvés: ${allSlides.length}`)
    
    if (allSlides.length > 0) {
      console.log('\n📋 Liste des slides:')
      allSlides.forEach((slide, index) => {
        console.log(`${index + 1}. ${slide.title}`)
        console.log(`   - Active: ${slide.isActive}`)
        console.log(`   - Ordre: ${slide.order}`)
        console.log(`   - Image: ${slide.image.substring(0, 50)}...`)
        console.log(`   - Bouton: ${slide.buttonText} -> ${slide.buttonLink}`)
        console.log('')
      })
      
      // Compter les slides actifs
      const activeSlides = allSlides.filter(slide => slide.isActive)
      console.log(`✅ Slides actifs: ${activeSlides.length}`)
      
      if (activeSlides.length === 0) {
        console.log('⚠️ Aucun slide actif trouvé! Activation de tous les slides...')
        await prisma.heroSlide.updateMany({
          data: { isActive: true }
        })
        console.log('✅ Tous les slides ont été activés')
      }
      
    } else {
      console.log('❌ Aucun slide trouvé dans la base de données')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkHeroSlides()
