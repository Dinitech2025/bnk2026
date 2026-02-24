const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getRealBannerData() {
  try {
    console.log('🔍 Connexion à la base de données...')
    
    // Récupérer toutes les bannières
    const banners = await prisma.heroBanner.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Trouvé ${banners.length} bannière(s) dans la base`)
    
    if (banners.length > 0) {
      const latestBanner = banners[0]
      console.log('\n🎯 Bannière la plus récente:')
      console.log('ID:', latestBanner.id)
      console.log('Active:', latestBanner.isActive)
      console.log('Titre:', latestBanner.title)
      console.log('Couleur titre:', latestBanner.titleColor || 'non définie')
      console.log('Couleur sous-titre:', latestBanner.subtitleColor || 'non définie') 
      console.log('Couleur description:', latestBanner.descriptionColor || 'non définie')
      console.log('Couleur bouton principal:', latestBanner.primaryButtonBg || 'non définie')
      console.log('Flou arrière-plan:', latestBanner.backgroundBlur || 'non défini')
      
      // Si cette bannière n'a pas les nouveaux champs, les ajouter
      if (!latestBanner.titleColor) {
        console.log('\n🔧 Mise à jour avec les nouveaux champs de couleur...')
        const updated = await prisma.heroBanner.update({
          where: { id: latestBanner.id },
          data: {
            titleColor: '#ff0000',          // Rouge vif
            subtitleColor: '#00ff00',       // Vert vif  
            descriptionColor: '#0000ff',    // Bleu vif
            primaryButtonBg: '#ff6600',     // Orange vif
            primaryButtonColor: '#ffffff',
            secondaryButtonBg: '#ffff00',   // Jaune vif
            secondaryButtonColor: '#000000',
            secondaryButtonBorder: '#ff00ff', // Magenta
            backgroundBlur: 3,
            backgroundOpacity: 70
          }
        })
        console.log('✅ Bannière mise à jour avec les couleurs vives !')
        return updated
      }
      
      return latestBanner
    } else {
      console.log('\n⚠️ Aucune bannière trouvée, création d\'une nouvelle...')
      const newBanner = await prisma.heroBanner.create({
        data: {
          isActive: true,
          title: 'Bienvenue chez',
          subtitle: 'Boutik\'nakà',
          description: 'Découvrez nos produits et services de qualité exceptionnelle',
          backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
          primaryButtonText: 'Produits',
          primaryButtonLink: '/products',
          secondaryButtonText: 'Services', 
          secondaryButtonLink: '/services',
          titleColor: '#ff0000',          // Rouge vif
          subtitleColor: '#00ff00',       // Vert vif  
          descriptionColor: '#0000ff',    // Bleu vif
          primaryButtonBg: '#ff6600',     // Orange vif
          primaryButtonColor: '#ffffff',
          secondaryButtonBg: '#ffff00',   // Jaune vif
          secondaryButtonColor: '#000000',
          secondaryButtonBorder: '#ff00ff', // Magenta
          backgroundBlur: 3,
          backgroundOpacity: 70
        }
      })
      console.log('✅ Nouvelle bannière créée avec les couleurs vives !')
      return newBanner
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

getRealBannerData()
