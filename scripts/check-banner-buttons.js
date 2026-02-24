const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkBannerButtons() {
  try {
    console.log('🔍 Vérification des boutons de la bannière...')
    
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (banner) {
      console.log('🎨 Données actuelles de la bannière:')
      console.log(`   - ID: ${banner.id}`)
      console.log(`   - Titre: "${banner.title}"`)
      console.log(`   - Sous-titre: "${banner.subtitle}"`)
      console.log(`   - Bouton principal: "${banner.primaryButtonText}" -> ${banner.primaryButtonLink}`)
      console.log(`   - Bouton secondaire: "${banner.secondaryButtonText}" -> ${banner.secondaryButtonLink}`)
      console.log(`   - Dernière mise à jour: ${banner.updatedAt}`)
      
      // Mettre à jour avec les vrais textes
      console.log('\n🔧 Mise à jour des boutons avec les bons textes...')
      const updated = await prisma.heroBanner.update({
        where: { id: banner.id },
        data: {
          primaryButtonText: 'Explorer nos Produits',
          primaryButtonLink: '/products',
          secondaryButtonText: 'Découvrir nos Services',
          secondaryButtonLink: '/services'
        }
      })
      
      console.log('✅ Boutons mis à jour:')
      console.log(`   - Bouton principal: "${updated.primaryButtonText}"`)
      console.log(`   - Bouton secondaire: "${updated.secondaryButtonText}"`)
      
    } else {
      console.log('❌ Aucune bannière active trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkBannerButtons()
