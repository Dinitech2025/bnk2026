const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedHeroBanner() {
  console.log('🎨 Initialisation de la bannière principale...')

  try {
    // Vérifier si une bannière existe déjà
    const existingBanner = await prisma.heroBanner.findFirst()

    if (existingBanner) {
      console.log('ℹ️ Une bannière existe déjà:', existingBanner.id)
      return
    }

    // Créer la bannière par défaut
    const defaultBanner = await prisma.heroBanner.create({
      data: {
        title: 'Bienvenue chez',
        subtitle: "Boutik'nakà",
        description: 'Découvrez nos produits et services de qualité exceptionnelle',
        backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        primaryButtonText: 'Explorer nos Produits',
        primaryButtonLink: '/products',
        secondaryButtonText: 'Découvrir nos Services',
        secondaryButtonLink: '/services',
        isActive: true
      }
    })

    console.log('✅ Bannière par défaut créée:', defaultBanner.id)
    console.log(`📝 Titre: "${defaultBanner.title} ${defaultBanner.subtitle}"`)
    console.log(`📸 Image: ${defaultBanner.backgroundImage}`)
    console.log(`🔗 Boutons: "${defaultBanner.primaryButtonText}" → ${defaultBanner.primaryButtonLink}`)
    console.log(`🔗         "${defaultBanner.secondaryButtonText}" → ${defaultBanner.secondaryButtonLink}`)

  } catch (error) {
    console.error('❌ Erreur lors de la création de la bannière:', error)
    throw error
  }
}

seedHeroBanner()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
