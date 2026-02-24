const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedServicesWithImages() {
  console.log('🔧 Ajout de services avec images...')

  // D'abord, créer quelques catégories de services si elles n'existent pas
  const categories = [
    {
      name: 'Développement Web',
      slug: 'developpement-web',
      description: 'Services de création et développement de sites web',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Design & Graphisme',
      slug: 'design-graphisme',
      description: 'Services de design graphique et création visuelle',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Marketing Digital',
      slug: 'marketing-digital',
      description: 'Services de marketing en ligne et réseaux sociaux',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Formation & Conseil',
      slug: 'formation-conseil',
      description: 'Services de formation et consultation professionnelle',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
  ]

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    })
    console.log(`✅ Catégorie de service "${category.name}" créée`)
  }

  // Récupérer les catégories créées
  const webDev = await prisma.serviceCategory.findUnique({ where: { slug: 'developpement-web' } })
  const design = await prisma.serviceCategory.findUnique({ where: { slug: 'design-graphisme' } })
  const marketing = await prisma.serviceCategory.findUnique({ where: { slug: 'marketing-digital' } })
  const formation = await prisma.serviceCategory.findUnique({ where: { slug: 'formation-conseil' } })

  const services = [
    // Développement Web
    {
      name: 'Création de Site Web Vitrine',
      slug: 'creation-site-web-vitrine',
      description: 'Développement d\'un site web professionnel pour présenter votre entreprise avec design responsive et optimisé SEO',
      price: 6750000, // ~1500 EUR en Ariary
      duration: 21, // 2-3 semaines en jours
      categoryId: webDev.id,
      pricingType: 'FIXED',
      images: [
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Boutique E-commerce Complète',
      slug: 'boutique-ecommerce-complete',
      description: 'Développement d\'une boutique en ligne complète avec gestion des paiements, stock et commandes',
      price: 15750000, // ~3500 EUR en Ariary
      duration: 42, // 4-6 semaines en jours
      categoryId: webDev.id,
      pricingType: 'NEGOTIABLE',
      images: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Application Mobile React Native',
      slug: 'application-mobile-react-native',
      description: 'Développement d\'application mobile cross-platform iOS et Android avec React Native',
      price: 22500000, // ~5000 EUR en Ariary
      duration: 56, // 6-8 semaines en jours
      categoryId: webDev.id,
      pricingType: 'RANGE',
      minPrice: 18000000, // ~4000 EUR en Ariary
      maxPrice: 36000000, // ~8000 EUR en Ariary
      images: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },

    // Design & Graphisme
    {
      name: 'Création de Logo Professionnel',
      slug: 'creation-logo-professionnel',
      description: 'Design de logo unique et professionnel avec plusieurs propositions et fichiers vectoriels',
      price: 1575000, // ~350 EUR en Ariary
      duration: 7, // 1 semaine en jours
      categoryId: design.id,
      pricingType: 'FIXED',
      images: [
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Identité Visuelle Complète',
      slug: 'identite-visuelle-complete',
      description: 'Création d\'une identité visuelle complète : logo, carte de visite, papeterie, charte graphique',
      price: 5400000, // ~1200 EUR en Ariary
      duration: 21, // 2-3 semaines en jours
      categoryId: design.id,
      pricingType: 'NEGOTIABLE',
      images: [
        'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },

    // Marketing Digital
    {
      name: 'Campagne Réseaux Sociaux',
      slug: 'campagne-reseaux-sociaux',
      description: 'Gestion complète de vos réseaux sociaux avec création de contenu et engagement communauté',
      price: 3600000, // ~800 EUR en Ariary
      duration: 30, // Mensuel en jours
      categoryId: marketing.id,
      pricingType: 'FIXED',
      images: [
        'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Audit SEO et Optimisation',
      slug: 'audit-seo-optimisation',
      description: 'Audit complet de votre site web et optimisation SEO pour améliorer votre référencement Google',
      price: 2700000, // ~600 EUR en Ariary
      duration: 14, // 1-2 semaines en jours
      categoryId: marketing.id,
      pricingType: 'FIXED',
      images: [
        'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },

    // Formation & Conseil
    {
      name: 'Formation WordPress',
      slug: 'formation-wordpress',
      description: 'Formation complète pour apprendre à créer et gérer votre site WordPress de A à Z',
      price: 2025000, // ~450 EUR en Ariary
      duration: 3, // 3 jours
      categoryId: formation.id,
      pricingType: 'FIXED',
      images: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      name: 'Consultation Stratégie Digitale',
      slug: 'consultation-strategie-digitale',
      description: 'Conseil personnalisé pour développer votre stratégie digitale et améliorer votre présence en ligne',
      price: 0, // Prix sur devis
      duration: 1, // Variable - minimum 1 jour
      categoryId: formation.id,
      pricingType: 'QUOTE_REQUIRED',
      images: [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    }
  ]

  for (const serviceData of services) {
    // Vérifier si le service existe déjà
    const existingService = await prisma.service.findUnique({
      where: { slug: serviceData.slug }
    })

    if (!existingService) {
      const { images, ...serviceInfo } = serviceData
      
      // Créer le service
      const service = await prisma.service.create({
        data: serviceInfo
      })

      // Ajouter les images en tant que Media
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i]
        const fileName = `${service.slug}-${i + 1}.jpg`
        await prisma.media.create({
          data: {
            name: `${service.name} - Image ${i + 1}`,
            fileName: fileName,
            mimeType: 'image/jpeg',
            path: imageUrl,
            size: 1024000, // Taille approximative

            type: 'IMAGE',
            services: {
              connect: { id: service.id }
            }
          }
        })
      }

      console.log(`✅ Service "${service.name}" créé avec ${images.length} images`)
    } else {
      console.log(`ℹ️ Service "${serviceData.name}" existe déjà`)
    }
  }

  console.log('🎉 Services avec images ajoutés avec succès!')
}

seedServicesWithImages()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
