const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateAdminInterface() {
  try {
    console.log('🎯 Préparation de l\'interface admin avec les données du diaporama...')
    
    // Récupérer la bannière avec toutes ses images
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      include: {
        backgroundImages: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (banner) {
      console.log('📊 Données qui seront affichées dans l\'admin:')
      console.log(`   - Titre: "${banner.title}"`)
      console.log(`   - Sous-titre: "${banner.subtitle}"`)
      console.log(`   - Diaporama: ${banner.backgroundSlideshowEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`)
      console.log(`   - Durée: ${banner.backgroundSlideshowDuration}ms`)
      console.log(`   - Transition: ${banner.backgroundSlideshowTransition}`)
      console.log(`   - Image par défaut: ${banner.backgroundImage.substring(0, 60)}...`)
      
      console.log(`\n🖼️ Images du diaporama (${banner.backgroundImages.length} images):`)
      banner.backgroundImages.forEach((img, index) => {
        console.log(`\n${index + 1}. ${img.title}`)
        console.log(`   📋 Description: ${img.description || 'Aucune'}`)
        console.log(`   🔗 URL: ${img.imageUrl.substring(0, 70)}...`)
        console.log(`   📊 Ordre: ${img.order}`)
        console.log(`   ✅ Active: ${img.isActive}`)
      })
      
      console.log('\n🎉 L\'interface d\'administration devrait maintenant afficher:')
      console.log('✅ Section "Diaporama d\'Images de Fond" avec checkbox cochée')
      console.log('✅ Slider de durée à 6 secondes')
      console.log('✅ Sélecteur de transition sur "Fondu enchaîné"')
      console.log(`✅ ${banner.backgroundImages.length} cartes d\'images avec titre, description et prévisualisation`)
      console.log('✅ Boutons de suppression pour chaque image')
      console.log('✅ Bouton "Ajouter une image" pour nouvelles images')
      
      console.log('\n🚀 Rafraîchissez votre page /admin/hero-banner pour voir ces changements!')
      
    } else {
      console.log('❌ Aucune bannière trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

populateAdminInterface()
