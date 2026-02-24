const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function configureSlideshow() {
  try {
    console.log('⚙️ Configuration du diaporama...')
    
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      include: { backgroundImages: true }
    })
    
    if (!banner) {
      console.log('❌ Aucune bannière trouvée')
      return
    }
    
    console.log(`📊 Bannière: ${banner.id}`)
    console.log(`🖼️ Images disponibles: ${banner.backgroundImages.length}`)
    
    // Configuration recommandée
    const config = {
      backgroundSlideshowEnabled: true,
      backgroundSlideshowDuration: 6000, // 6 secondes
      backgroundSlideshowTransition: 'fade' // Transition douce
    }
    
    await prisma.heroBanner.update({
      where: { id: banner.id },
      data: config
    })
    
    console.log('\n✅ Configuration appliquée:')
    console.log(`   - Diaporama: ${config.backgroundSlideshowEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`)
    console.log(`   - Durée: ${config.backgroundSlideshowDuration}ms (${config.backgroundSlideshowDuration/1000}s)`)
    console.log(`   - Transition: ${config.backgroundSlideshowTransition}`)
    
    console.log('\n🎯 Résultat attendu:')
    console.log('- Les images de fond changent automatiquement toutes les 6 secondes')
    console.log('- Transition en fondu enchaîné fluide')
    console.log('- Indicateurs cliquables en bas à gauche')
    console.log('- Compteur d\'images visible')
    
    console.log('\n🚀 Rafraîchissez votre page d\'accueil pour voir le diaporama !')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

configureSlideshow()
