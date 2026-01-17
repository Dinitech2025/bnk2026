const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Script complet pour initialiser la homepage avec :
 * - HeroSlides avec images multiples
 * - HeroBanner avec diaporama d'images
 */

async function seedHomepageComplete() {
  try {
    console.log('🏠 Initialisation complète de la homepage...\n')
    
    // ===== ÉTAPE 1: Créer les Hero Slides =====
    console.log('📍 ÉTAPE 1: Hero Slides')
    console.log('=' .repeat(50))
    
    const defaultSlides = [
      {
        title: 'Découvrez nos Services Premium',
        description: 'Consultation, développement et accompagnement personnalisé',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        buttonText: 'Explorer nos Services',
        buttonLink: '/services',
        isActive: true,
        order: 1,
        slideshowEnabled: true,
        slideshowDuration: 5000,
        slideshowTransition: 'fade',
        titleColor: '#ffffff',
        descriptionColor: '#f3f4f6',
        buttonTextColor: '#ffffff',
        buttonBgColor: '#3b82f6',
        overlayColor: '#000000',
        overlayOpacity: 50
      },
      {
        title: 'Solutions Technologiques Innovantes',
        description: 'Développement web et mobile, applications sur mesure',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        buttonText: 'Nos Technologies',
        buttonLink: '/services',
        isActive: true,
        order: 2,
        slideshowEnabled: true,
        slideshowDuration: 5000,
        slideshowTransition: 'fade',
        titleColor: '#ffffff',
        descriptionColor: '#f3f4f6',
        buttonTextColor: '#ffffff',
        buttonBgColor: '#10b981',
        overlayColor: '#000000',
        overlayOpacity: 45
      },
      {
        title: 'Formation & Accompagnement',
        description: 'Formations professionnelles et coaching personnalisé',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        buttonText: 'Découvrir les Formations',
        buttonLink: '/services',
        isActive: true,
        order: 3,
        slideshowEnabled: true,
        slideshowDuration: 5000,
        slideshowTransition: 'fade',
        titleColor: '#ffffff',
        descriptionColor: '#f3f4f6',
        buttonTextColor: '#ffffff',
        buttonBgColor: '#f59e0b',
        overlayColor: '#000000',
        overlayOpacity: 55
      }
    ]
    
    const existingSlides = await prisma.heroSlide.count()
    let createdSlides = []
    
    if (existingSlides === 0) {
      for (const slideData of defaultSlides) {
        const slide = await prisma.heroSlide.create({
          data: slideData
        })
        createdSlides.push(slide)
      }
      console.log(`✅ ${createdSlides.length} slides créés`)
    } else {
      createdSlides = await prisma.heroSlide.findMany({
        orderBy: { order: 'asc' }
      })
      console.log(`ℹ️  ${existingSlides} slide(s) déjà existant(s)`)
    }
    
    // ===== ÉTAPE 2: Ajouter des images multiples aux slides =====
    console.log('\n📍 ÉTAPE 2: Images pour les Hero Slides')
    console.log('=' .repeat(50))
    
    const slideImageCollections = {
      service: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Consultation professionnelle',
          description: 'Services de conseil',
          alt: 'Équipe en consultation',
          order: 1
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Stratégie business',
          description: 'Accompagnement stratégique',
          alt: 'Session de stratégie',
          order: 2
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Innovation collaborative',
          description: 'Solutions innovantes',
          alt: 'Équipe collaborative',
          order: 3
        }
      ],
      technology: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Développement web',
          description: 'Sites web modernes',
          alt: 'Code de développement',
          order: 1
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Programmation avancée',
          description: 'Solutions techniques',
          alt: 'Développeur programmant',
          order: 2
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Technologies de pointe',
          description: 'Stack moderne',
          alt: 'Technologies web',
          order: 3
        }
      ],
      formation: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Formation professionnelle',
          description: 'Apprentissage actif',
          alt: 'Session de formation',
          order: 1
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Travail d\'équipe',
          description: 'Collaboration efficace',
          alt: 'Équipe en formation',
          order: 2
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Excellence éducative',
          description: 'Formation continue',
          alt: 'Environnement d\'apprentissage',
          order: 3
        }
      ]
    }
    
    let totalSlideImages = 0
    const collections = [
      slideImageCollections.service,
      slideImageCollections.technology,
      slideImageCollections.formation
    ]
    
    for (let i = 0; i < createdSlides.length && i < collections.length; i++) {
      const slide = createdSlides[i]
      const images = collections[i]
      
      console.log(`\n🎯 Slide "${slide.title}"`)
      
      // Supprimer les anciennes images si elles existent
      await prisma.heroSlideImage.deleteMany({
        where: { heroSlideId: slide.id }
      })
      
      // Ajouter les nouvelles images
      for (const imageData of images) {
        await prisma.heroSlideImage.create({
          data: {
            heroSlideId: slide.id,
            ...imageData,
            isActive: true
          }
        })
        totalSlideImages++
      }
      
      console.log(`   ✅ ${images.length} image(s) ajoutée(s)`)
    }
    
    console.log(`\n✅ Total: ${totalSlideImages} images ajoutées aux slides`)
    
    // ===== ÉTAPE 3: Créer/Mettre à jour la Hero Banner =====
    console.log('\n📍 ÉTAPE 3: Hero Banner')
    console.log('=' .repeat(50))
    
    let banner = await prisma.heroBanner.findFirst()
    
    if (!banner) {
      banner = await prisma.heroBanner.create({
        data: {
          title: 'Bienvenue chez',
          subtitle: "Boutik'nakà",
          description: 'Découvrez nos produits et services de qualité exceptionnelle pour transformer votre expérience',
          backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          primaryButtonText: 'Explorer nos Produits',
          primaryButtonLink: '/products',
          primaryButtonColor: '#ffffff',
          primaryButtonBg: '#3b82f6',
          secondaryButtonText: 'Découvrir nos Services',
          secondaryButtonLink: '/services',
          secondaryButtonColor: '#ffffff',
          secondaryButtonBg: 'transparent',
          secondaryButtonBorder: '#ffffff',
          titleColor: '#ffffff',
          subtitleColor: '#fde047',
          descriptionColor: '#f3f4f6',
          backgroundSlideshowEnabled: true,
          backgroundSlideshowDuration: 6000,
          backgroundSlideshowTransition: 'fade',
          backgroundBlur: 0,
          backgroundOpacity: 45,
          backgroundOverlayColor: '#000000',
          isActive: true
        }
      })
      console.log('✅ Bannière créée')
    } else {
      console.log('ℹ️  Bannière existante trouvée')
    }
    
    // ===== ÉTAPE 4: Ajouter des images à la bannière =====
    console.log('\n📍 ÉTAPE 4: Images pour la Hero Banner')
    console.log('=' .repeat(50))
    
    const bannerImages = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Commerce moderne',
        description: 'Environnement commercial dynamique',
        order: 1
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff37d1306?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Consultation professionnelle',
        description: 'Services de conseil personnalisés',
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
        title: 'Espaces modernes',
        description: 'Bureaux contemporains et élégants',
        order: 4
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        title: 'Architecture premium',
        description: 'Design contemporain et raffiné',
        order: 5
      }
    ]
    
    // Supprimer les anciennes images
    await prisma.heroBannerImage.deleteMany({
      where: { heroBannerId: banner.id }
    })
    
    // Ajouter les nouvelles images
    for (const imageData of bannerImages) {
      await prisma.heroBannerImage.create({
        data: {
          heroBannerId: banner.id,
          ...imageData,
          isActive: true
        }
      })
    }
    
    console.log(`✅ ${bannerImages.length} image(s) ajoutée(s) à la bannière`)
    
    // ===== RÉCAPITULATIF =====
    console.log('\n' + '='.repeat(50))
    console.log('🎉 INITIALISATION TERMINÉE AVEC SUCCÈS !')
    console.log('='.repeat(50))
    console.log(`📊 Résumé:`)
    console.log(`   • ${createdSlides.length} Hero Slides`)
    console.log(`   • ${totalSlideImages} images pour les slides`)
    console.log(`   • 1 Hero Banner`)
    console.log(`   • ${bannerImages.length} images pour la bannière`)
    console.log(`   • Diaporamas activés avec transitions "fade"`)
    console.log(`\n🌐 Votre homepage est prête à être utilisée !`)
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error.message)
    console.error(error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedHomepageComplete()




