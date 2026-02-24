const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBannerColors() {
  try {
    console.log('🎨 Test des couleurs de bannière...')
    
    // Récupérer la bannière active
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (!banner) {
      console.log('❌ Aucune bannière trouvée')
      return
    }
    
    console.log('📊 Bannière actuelle:', banner.id)
    console.log('🎨 Couleurs actuelles:')
    console.log('   - Titre:', banner.titleColor)
    console.log('   - Sous-titre:', banner.subtitleColor)
    console.log('   - Description:', banner.descriptionColor)
    console.log('   - Bouton 1:', banner.primaryButtonBg)
    console.log('   - Bouton 2:', banner.secondaryButtonBorder)
    console.log('   - Flou:', banner.backgroundBlur + 'px')
    console.log('   - Opacité:', banner.backgroundOpacity + '%')
    
    // Modifier les couleurs pour test
    const updatedBanner = await prisma.heroBanner.update({
      where: { id: banner.id },
      data: {
        titleColor: '#ff0000',        // Rouge pour le titre
        subtitleColor: '#00ff00',     // Vert pour le sous-titre
        descriptionColor: '#0000ff',  // Bleu pour la description
        primaryButtonBg: '#ff6600',   // Orange pour le bouton principal
        secondaryButtonBorder: '#ff00ff', // Magenta pour la bordure
        backgroundBlur: 5,            // Flou à 5px
        backgroundOpacity: 60         // Opacité à 60%
      }
    })
    
    console.log('✅ Couleurs modifiées pour le test!')
    console.log('🌈 Nouvelles couleurs:')
    console.log('   - Titre: Rouge (#ff0000)')
    console.log('   - Sous-titre: Vert (#00ff00)')
    console.log('   - Description: Bleu (#0000ff)')
    console.log('   - Bouton principal: Orange (#ff6600)')
    console.log('   - Bordure bouton 2: Magenta (#ff00ff)')
    console.log('   - Flou: 5px')
    console.log('   - Opacité: 60%')
    console.log('')
    console.log('🔗 Visitez http://localhost:3000 pour voir les changements!')
    console.log('💡 Refresh la page si nécessaire pour voir l\'effet.')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBannerColors()
