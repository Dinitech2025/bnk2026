const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addOverlayColorField() {
  try {
    console.log('🔍 Mise à jour de la bannière avec le nouveau champ couleur overlay...')
    
    // Récupérer la bannière active
    const activeBanner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (activeBanner) {
      console.log('📊 Bannière trouvée:', activeBanner.id)
      
      // Mettre à jour avec la couleur overlay blanche pour test
      const updated = await prisma.heroBanner.update({
        where: { id: activeBanner.id },
        data: {
          backgroundOverlayColor: '#ffffff' // Blanc pour contraster avec les couleurs vives
        }
      })
      
      console.log('✅ Bannière mise à jour avec couleur overlay blanche')
      console.log('🎨 Nouvelles valeurs:')
      console.log('- Couleur overlay:', updated.backgroundOverlayColor)
      console.log('- Opacité:', updated.backgroundOpacity + '%')
      
    } else {
      console.log('⚠️ Aucune bannière active trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addOverlayColorField()
