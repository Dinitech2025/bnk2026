const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addServicePricingExamples() {
  console.log('🔄 Ajout des exemples de services avec différents types de pricing...')

  try {
    // Récupérer ou créer une catégorie de services
    let category = await prisma.serviceCategory.findUnique({
      where: { slug: 'consultation' }
    })

    if (!category) {
      category = await prisma.serviceCategory.create({
        data: {
          name: 'Consultation',
          slug: 'consultation',
          description: 'Services de consultation et conseil'
        }
      })
    }

    // Services avec différents types de pricing
    const servicesToCreate = [
      {
        name: 'Consultation Standard',
        slug: 'consultation-standard',
        description: 'Consultation de base avec prix fixe',
        price: 50,
        duration: 60,
        pricingType: 'FIXED',
        categoryId: category.id,
        requiresQuote: false,
        autoAcceptNegotiation: false,
        published: true
      },
      {
        name: 'Consultation Personnalisée',
        slug: 'consultation-personnalisee',
        description: 'Consultation avec prix négociable selon vos besoins',
        price: 75,
        duration: 90,
        pricingType: 'NEGOTIABLE',
        categoryId: category.id,
        requiresQuote: false,
        autoAcceptNegotiation: false,
        published: true
      },
      {
        name: 'Audit Entreprise',
        slug: 'audit-entreprise',
        description: 'Audit complet avec tarif selon la taille de l\'entreprise',
        price: 200,
        minPrice: 150,
        maxPrice: 500,
        duration: 240,
        pricingType: 'RANGE',
        categoryId: category.id,
        requiresQuote: false,
        autoAcceptNegotiation: true, // Auto-accepter dans la plage
        published: true
      },
      {
        name: 'Projet Sur Mesure',
        slug: 'projet-sur-mesure',
        description: 'Projet complexe nécessitant une évaluation détaillée',
        price: 1000,
        duration: 480,
        pricingType: 'QUOTE_REQUIRED',
        categoryId: category.id,
        requiresQuote: true,
        autoAcceptNegotiation: false,
        published: true
      }
    ]

    // Créer les services
    for (const serviceData of servicesToCreate) {
      const existingService = await prisma.service.findUnique({
        where: { slug: serviceData.slug }
      })

      if (existingService) {
        console.log(`⚠️  Service "${serviceData.name}" existe déjà, mise à jour...`)
        await prisma.service.update({
          where: { id: existingService.id },
          data: serviceData
        })
      } else {
        await prisma.service.create({
          data: serviceData
        })
        console.log(`✅ Service "${serviceData.name}" créé avec pricing type: ${serviceData.pricingType}`)
      }
    }

    // Créer des exemples de devis pour tester l'interface admin
    const demoUser = await prisma.user.findFirst({
      where: { email: { not: null } }
    })

    if (demoUser) {
      const quoteRequiredService = await prisma.service.findUnique({
        where: { slug: 'projet-sur-mesure' }
      })

      if (quoteRequiredService) {
        const existingQuote = await prisma.serviceQuote.findFirst({
          where: {
            serviceId: quoteRequiredService.id,
            userId: demoUser.id
          }
        })

        if (!existingQuote) {
          await prisma.serviceQuote.create({
            data: {
              serviceId: quoteRequiredService.id,
              userId: demoUser.id,
              proposedPrice: 1200,
              clientMessage: 'Bonjour, j\'aimerais développer une application web avec fonctionnalités e-commerce complètes. Mon budget est d\'environ 1200€.',
              quantity: 1,
              status: 'PENDING'
            }
          })
          console.log('✅ Exemple de devis créé pour test admin')
        }
      }

      // Créer un devis pour service négociable
      const negotiableService = await prisma.service.findUnique({
        where: { slug: 'consultation-personnalisee' }
      })

      if (negotiableService) {
        const existingNegotiation = await prisma.serviceQuote.findFirst({
          where: {
            serviceId: negotiableService.id,
            userId: demoUser.id
          }
        })

        if (!existingNegotiation) {
          await prisma.serviceQuote.create({
            data: {
              serviceId: negotiableService.id,
              userId: demoUser.id,
              proposedPrice: 60,
              clientMessage: 'Pouvez-vous faire un effort sur le prix pour une consultation de 60€ ?',
              quantity: 1,
              status: 'PENDING'
            }
          })
          console.log('✅ Exemple de négociation créé pour test admin')
        }
      }
    }

    console.log('🎉 Exemples de services avec pricing ajoutés avec succès!')
    console.log(`
    📋 Types de pricing créés :
    - FIXED: Consultation Standard (50€)
    - NEGOTIABLE: Consultation Personnalisée (75€)
    - RANGE: Audit Entreprise (150€-500€, auto-accept)
    - QUOTE_REQUIRED: Projet Sur Mesure (devis requis)
    
    🔧 Test des fonctionnalités :
    1. Allez sur /services pour voir les différents types
    2. Testez l'ajout au panier avec négociation
    3. Accédez à /admin/quotes pour gérer les devis
    `)

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des exemples:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  addServicePricingExamples()
}

module.exports = { addServicePricingExamples } 