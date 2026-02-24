const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDifferentTransitions() {
  try {
    console.log('🎭 Test des différents effets de transition...')
    
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (!banner) {
      console.log('❌ Aucune bannière trouvée')
      return
    }
    
    console.log('📊 Bannière trouvée:', banner.id)
    
    const transitions = [
      { name: 'fade', description: 'Fondu enchaîné', duration: 4000 },
      { name: 'slide', description: 'Glissement horizontal', duration: 5000 },
      { name: 'zoom', description: 'Zoom avec fondu', duration: 6000 }
    ]
    
    console.log('\n🎬 Configuration des différentes transitions:')
    
    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i]
      
      await prisma.heroBanner.update({
        where: { id: banner.id },
        data: {
          backgroundSlideshowTransition: transition.name,
          backgroundSlideshowDuration: transition.duration,
          backgroundSlideshowEnabled: true
        }
      })
      
      console.log(`${i + 1}. ${transition.name} - ${transition.description} (${transition.duration}ms)`)
      
      if (i < transitions.length - 1) {
        console.log('   ⏳ Attendez 10 secondes pour voir l\'effet...')
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }
    
    console.log('\n✅ Test terminé ! La bannière utilise maintenant la transition "zoom"')
    console.log('\n🎯 Pour tester:')
    console.log('1. Rafraîchissez votre page d\'accueil')
    console.log('2. Observez le changement d\'images toutes les 6 secondes')
    console.log('3. Cliquez sur les indicateurs en bas à gauche pour naviguer')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDifferentTransitions()
