const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBannerImages() {
  try {
    console.log('🖼️ Ajout d\'images de fond pour le diaporama...')
    
    // Récupérer la bannière active
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (!banner) {
      console.log('❌ Aucune bannière active trouvée')
      return
    }
    
    console.log(`📊 Bannière trouvée: ${banner.id}`)
    
    // Images de fond variées et attrayantes
    const backgroundImages = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Commerce moderne',
        description: 'Environnement commercial moderne et dynamique',
        order: 1
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff37d1306?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Consultation professionnelle',
        description: 'Services de conseil et accompagnement',
        order: 2
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Innovation technologique',
        description: 'Solutions technologiques avancées',
        order: 3
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Bureaux modernes',
        description: 'Espaces de travail contemporains',
        order: 4
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Architecture moderne',
        description: 'Design contemporain et élégant',
        order: 5
      }
    ]
    
    // Vérifier si des images existent déjà
    const existingImages = await prisma.heroBannerImage.findMany({
      where: { heroBannerId: banner.id }
    })
    
    if (existingImages.length > 0) {
      console.log(`📋 ${existingImages.length} image(s) déjà présente(s)`)
      console.log('⚠️ Suppression des anciennes images pour renouveler...')
      await prisma.heroBannerImage.deleteMany({
        where: { heroBannerId: banner.id }
      })
    }
    
    // Ajouter les nouvelles images
    for (const imageData of backgroundImages) {
      await prisma.heroBannerImage.create({
        data: {
          heroBannerId: banner.id,
          ...imageData
        }
      })
    }
    
    // Activer le diaporama
    await prisma.heroBanner.update({
      where: { id: banner.id },
      data: {
        backgroundSlideshowEnabled: true,
        backgroundSlideshowDuration: 6000, // 6 secondes entre les changements
        backgroundSlideshowTransition: 'fade' // Transition fondu
      }
    })
    
    console.log(`✅ ${backgroundImages.length} images ajoutées avec succès !`)
    console.log('🎬 Diaporama activé avec transition "fade" (6 secondes)')
    console.log('\n📋 Images ajoutées:')
    backgroundImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.title} - ${img.description}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedBannerImages()
