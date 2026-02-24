const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setWhiteOverlay() {
  try {
    console.log('🎨 Configuration overlay blanc semi-transparent...')
    
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (banner) {
      const updated = await prisma.heroBanner.update({
        where: { id: banner.id },
        data: {
          backgroundOverlayColor: '#ffffff', // Blanc
          backgroundOpacity: 30,              // 30% d'opacité
          backgroundBlur: 2                   // Flou léger
        }
      })
      
      console.log('✅ Bannière configurée avec overlay blanc:')
      console.log('- Couleur:', updated.backgroundOverlayColor)
      console.log('- Opacité:', updated.backgroundOpacity + '%')
      console.log('- Flou:', updated.backgroundBlur + 'px')
      
      // Calculer la couleur finale
      const hexOpacity = Math.round((updated.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')
      const finalColor = `${updated.backgroundOverlayColor}${hexOpacity}`
      console.log('🎯 Couleur CSS finale:', finalColor)
      console.log('📱 Effet: Overlay blanc léger pour un texte coloré visible')
      
    } else {
      console.log('❌ Aucune bannière active trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setWhiteOverlay()
