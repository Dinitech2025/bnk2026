const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateHeroBannerFields() {
  try {
    console.log('🎨 Mise à jour de la bannière héro avec les nouveaux champs...')
    
    // Trouver la bannière active
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (banner) {
      console.log('📝 Bannière trouvée:', banner.id)
      
      // Mettre à jour avec les nouveaux champs
      const updated = await prisma.heroBanner.update({
        where: { id: banner.id },
        data: {
          // Couleurs de texte par défaut
          titleColor: '#ffffff',
          subtitleColor: '#fde047', 
          descriptionColor: '#ffffff',
          
          // Couleurs de boutons par défaut
          primaryButtonColor: '#ffffff',
          primaryButtonBg: '#3b82f6',
          secondaryButtonColor: '#ffffff',
          secondaryButtonBg: 'transparent',
          secondaryButtonBorder: '#ffffff',
          
          // Effets par défaut
          backgroundBlur: 0,
          backgroundOpacity: 40
        }
      })
      
      console.log('✅ Bannière mise à jour avec succès!')
      console.log('🎨 Nouvelles couleurs configurées:')
      console.log('   - Titre:', updated.titleColor)
      console.log('   - Sous-titre:', updated.subtitleColor)
      console.log('   - Description:', updated.descriptionColor)
      console.log('   - Bouton principal:', updated.primaryButtonBg)
      console.log('   - Bouton secondaire:', updated.secondaryButtonBorder)
      console.log('   - Opacité overlay:', updated.backgroundOpacity + '%')
      
    } else {
      // Créer une nouvelle bannière avec tous les champs
      console.log('📝 Aucune bannière trouvée, création d\'une nouvelle...')
      
      const newBanner = await prisma.heroBanner.create({
        data: {
          title: 'Bienvenue chez',
          subtitle: "Boutik'nakà",
          description: 'Découvrez nos produits et services de qualité exceptionnelle',
          backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          
          // Couleurs de texte
          titleColor: '#ffffff',
          subtitleColor: '#fde047',
          descriptionColor: '#ffffff',
          
          // Boutons
          primaryButtonText: 'Explorer nos Produits',
          primaryButtonLink: '/products',
          primaryButtonColor: '#ffffff',
          primaryButtonBg: '#3b82f6',
          
          secondaryButtonText: 'Découvrir nos Services',
          secondaryButtonLink: '/services',
          secondaryButtonColor: '#ffffff',
          secondaryButtonBg: 'transparent',
          secondaryButtonBorder: '#ffffff',
          
          // Effets
          backgroundBlur: 0,
          backgroundOpacity: 40,
          
          isActive: true
        }
      })
      
      console.log('✅ Nouvelle bannière créée:', newBanner.id)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateHeroBannerFields()
