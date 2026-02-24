const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedHeroSlides() {
  console.log('🎬 Ajout des slides par défaut...')

  const defaultSlides = [
    {
      title: 'Consultation',
      description: 'Services de conseil et consultation professionnelle',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1926&q=80',
      buttonText: 'Découvrir',
      buttonLink: '/services',
      isActive: true,
      order: 1
    },
    {
      title: 'Développement Web',
      description: 'Services de création et développement de sites web',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80',
      buttonText: 'Découvrir',
      buttonLink: '/services',
      isActive: true,
      order: 2
    },
    {
      title: 'Formation',
      description: 'Services de formation et accompagnement',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      buttonText: 'Découvrir',
      buttonLink: '/services',
      isActive: true,
      order: 3
    },
    {
      title: 'Maintenance',
      description: 'Services de maintenance et support technique',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      buttonText: 'Découvrir',
      buttonLink: '/services',
      isActive: true,
      order: 4
    }
  ]

  // Vérifier s'il y a déjà des slides
  const existingSlides = await prisma.heroSlide.count()
  
  if (existingSlides === 0) {
    await prisma.heroSlide.createMany({
      data: defaultSlides
    })
    console.log(`✅ ${defaultSlides.length} slides par défaut ajoutés`)
  } else {
    console.log(`ℹ️ Des slides existent déjà (${existingSlides}), aucun ajout effectué`)
  }

  console.log('🎉 Slides par défaut ajoutés avec succès!')
}

seedHeroSlides()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
