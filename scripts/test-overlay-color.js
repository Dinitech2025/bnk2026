const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testOverlayColor() {
  try {
    console.log('🧪 Test de la couleur overlay...')
    
    // Récupérer la bannière directement de la base
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        backgroundOverlayColor: true,
        backgroundOpacity: true,
        backgroundBlur: true
      }
    })

    if (banner) {
      console.log('✅ Bannière trouvée:')
      console.log('- ID:', banner.id)
      console.log('- Couleur overlay:', banner.backgroundOverlayColor)
      console.log('- Opacité:', banner.backgroundOpacity + '%')
      console.log('- Flou:', banner.backgroundBlur + 'px')
      
      // Calculer la couleur finale avec opacité
      const hexOpacity = Math.round((banner.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')
      const finalColor = `${banner.backgroundOverlayColor}${hexOpacity}`
      
      console.log('🎨 Couleur finale avec opacité:', finalColor)
      
      // Test avec différentes couleurs
      console.log('\n🧪 Tests avec différentes couleurs:')
      
      // Tester blanc
      await prisma.heroBanner.update({
        where: { id: banner.id },
        data: { backgroundOverlayColor: '#ffffff' }
      })
      console.log('✅ Couleur overlay définie à blanc (#ffffff)')
      
      // Attendre un peu puis tester bleu
      setTimeout(async () => {
        await prisma.heroBanner.update({
          where: { id: banner.id },
          data: { backgroundOverlayColor: '#3b82f6' }
        })
        console.log('✅ Couleur overlay définie à bleu (#3b82f6)')
        
        await prisma.$disconnect()
      }, 2000)
      
    } else {
      console.log('❌ Aucune bannière active trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    await prisma.$disconnect()
  }
}

testOverlayColor()
