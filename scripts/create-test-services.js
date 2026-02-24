const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestServices() {
  console.log('🔧 Création de services de test avec différents cas...\n')

  try {
    // Vérifier si des catégories existent
    let categories = await prisma.serviceCategory.findMany()

    if (categories.length === 0) {
      console.log('📁 Création des catégories de services...')

      categories = await Promise.all([
        prisma.serviceCategory.create({
          data: {
            name: 'Maintenance',
            slug: 'maintenance',
            description: 'Services de maintenance et réparation',
            image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
          }
        }),
        prisma.serviceCategory.create({
          data: {
            name: 'Installation',
            slug: 'installation',
            description: 'Services d\'installation et configuration',
            image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
          }
        }),
        prisma.serviceCategory.create({
          data: {
            name: 'Consultation',
            slug: 'consultation',
            description: 'Services de conseil et consultation',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
          }
        }),
        prisma.serviceCategory.create({
          data: {
            name: 'Formation',
            slug: 'formation',
            description: 'Formations et ateliers',
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
          }
        }),
        prisma.serviceCategory.create({
          data: {
            name: 'Support',
            slug: 'support',
            description: 'Support technique et assistance',
            image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop',
          }
        }),
      ])

      console.log(`✅ ${categories.length} catégories créées`)
    }

    // Services avec différents cas d'usage
    const services = [
      // CAS 1: Service gratuit (consultation initiale)
      {
        name: 'Consultation Initiale Gratuite',
        description: 'Première consultation gratuite pour évaluer vos besoins. Durée de 30 minutes pour comprendre votre projet et vous proposer les meilleures solutions.',
        price: 0,
        duration: 30,
        categoryId: categories.find(c => c.slug === 'consultation')?.id,
        published: true,
        pricingType: 'FIXED',
        slug: 'consultation-gratuite',
        pricingType: 'FIXED',
        images: [
          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
        ]
      },

      // CAS 2: Service payant simple (maintenance)
      {
        name: 'Maintenance Ordinateur Standard',
        description: 'Nettoyage complet, optimisation système, mise à jour des logiciels. Résolution des problèmes de performance et sécurité.',
        price: 25000, // 25,000 Ar
        duration: 120,
        categoryId: categories.find(c => c.slug === 'maintenance')?.id,
        published: true,
        pricingType: 'FIXED',
        slug: 'maintenance-ordinateur-standard',
        pricingType: 'FIXED',
        images: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop'
        ]
      },

      // CAS 3: Service avec durée longue (formation)
      {
        name: 'Formation Bureautique Complète',
        description: 'Formation intensive sur les outils bureautiques : Word, Excel, PowerPoint. 3 jours de formation pratique avec exercices et certificat.',
        price: 150000, // 150,000 Ar
        duration: 1440, // 3 jours en minutes
        categoryId: categories.find(c => c.slug === 'formation')?.id,
        published: true,
        pricingType: 'FIXED',
        slug: 'formation-bureautique-complete',
        images: [
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'
        ]
      },

      // CAS 4: Service urgent (support express)
      {
        name: 'Support Technique Express',
        description: 'Intervention d\'urgence pour problèmes critiques. Support prioritaire sous 2h. Parfait pour les pannes bloquantes.',
        price: 50000, // 50,000 Ar (supplément urgence)
        duration: 60,
        categoryId: categories.find(c => c.slug === 'support')?.id,
        published: true,
        pricingType: 'FIXED',
        slug: 'support-express',
        images: [
          'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop'
        ]
      },

      // CAS 5: Service complexe (installation réseau)
      {
        name: 'Installation Réseau Professionnel',
        description: 'Installation complète d\'un réseau d\'entreprise : câblage, configuration routeur, sécurité, postes de travail. Formation incluse.',
        price: 500000, // 500,000 Ar
        duration: 480, // 8h
        categoryId: categories.find(c => c.slug === 'installation')?.id,
        published: true,
        pricingType: 'NEGOTIABLE', // Prix négociable selon la complexité
        requiresQuote: true,
        autoAcceptNegotiation: false,
        slug: 'installation-reseau-pro',
        images: [
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop'
        ]
      },

      // CAS 6: Service non publié (brouillon)
      {
        name: 'Migration Cloud Entreprise',
        description: 'Migration complète de votre infrastructure vers le cloud. Audit, planification, exécution, formation. Service sur mesure.',
        price: 1000000, // 1,000,000 Ar
        duration: 2880, // 5 jours
        categoryId: categories.find(c => c.slug === 'consultation')?.id,
        published: false, // Non publié
        pricingType: 'NEGOTIABLE', // Prix négociable selon l'infrastructure existante
        requiresQuote: true,
        autoAcceptNegotiation: false,
        slug: 'migration-cloud-entreprise',
        images: [
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop'
        ]
      },

      // CAS 7: Service avec prix élevé (audit sécurité)
      {
        name: 'Audit Sécurité Complet',
        description: 'Audit de sécurité complet : réseau, applications, données, conformité RGPD. Rapport détaillé avec recommandations.',
        price: 750000, // 750,000 Ar
        duration: 960, // 16h sur 2-3 jours
        categoryId: categories.find(c => c.slug === 'consultation')?.id,
        published: true,
        pricingType: 'QUOTE_REQUIRED', // Nécessite un devis
        requiresQuote: true,
        slug: 'audit-securite-complet',
        images: [
          'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop'
        ]
      },

      // CAS 8: Service très court (diagnostic rapide)
      {
        name: 'Diagnostic Express',
        description: 'Diagnostic rapide de 15 minutes pour identifier les problèmes urgents. Rapport immédiat avec solutions prioritaires.',
        price: 15000, // 15,000 Ar
        duration: 15,
        categoryId: categories.find(c => c.slug === 'support')?.id,
        published: true,
        pricingType: 'FIXED',
        slug: 'diagnostic-express',
        images: [
          'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop'
        ]
      },

      // CAS 9: Service avec durée très longue (projet complet)
      {
        name: 'Développement Application Web',
        description: 'Développement complet d\'une application web sur mesure. Analyse, design, développement, tests, déploiement. Projet de 3 mois.',
        price: 2500000, // 2,500,000 Ar
        duration: 129600, // 3 mois en minutes (90 jours * 24h * 60min)
        categoryId: categories.find(c => c.slug === 'installation')?.id,
        published: true,
        pricingType: 'QUOTE_REQUIRED', // Nécessite un devis car projet sur mesure
        requiresQuote: true,
        slug: 'developpement-app-web',
        images: [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop'
        ]
      },

      // CAS 10: Service avec images multiples
      {
        name: 'Pack Maintenance Premium',
        description: 'Maintenance préventive mensuelle + support prioritaire + sauvegarde automatique. Service complet pour entreprises.',
        price: 100000, // 100,000 Ar/mois
        duration: 480, // 8h par intervention
        categoryId: categories.find(c => c.slug === 'maintenance')?.id,
        published: true,
        pricingType: 'FIXED',
        slug: 'pack-maintenance-premium',
        images: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
        ]
      },

      // CAS 11: Service avec fourchette de prix (RANGE)
      {
        name: 'Formation Personnalisée',
        description: 'Formation sur mesure selon vos besoins : bureautique, développement, réseau, sécurité. Programme adapté à votre niveau et objectifs.',
        price: 200000, // Prix de base
        minPrice: 150000, // 150,000 Ar minimum
        maxPrice: 400000, // 400,000 Ar maximum
        duration: 480, // 8h par session (ajustable)
        categoryId: categories.find(c => c.slug === 'formation')?.id,
        published: true,
        slug: 'formation-personnalisee',
        pricingType: 'RANGE', // Fourchette de prix selon la complexité
        requiresQuote: true,
        images: [
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'
        ]
      },

      // CAS 12: Service négociable avec auto-acceptation
      {
        name: 'Maintenance Préventive',
        description: 'Maintenance préventive mensuelle de votre système. Nettoyage, mises à jour, optimisation. Intervention planifiée pour éviter les pannes.',
        price: 75000, // 75,000 Ar/mois
        duration: 240, // 4h par mois
        categoryId: categories.find(c => c.slug === 'maintenance')?.id,
        published: true,
        slug: 'maintenance-preventive',
        pricingType: 'NEGOTIABLE', // Prix négociable
        requiresQuote: false,
        autoAcceptNegotiation: true, // Accepte automatiquement les petites négos
        images: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop'
        ]
      }
    ]

    console.log(`\n📋 Création de ${services.length} services de test...\n`)

    let createdCount = 0
    let updatedCount = 0

    for (const serviceData of services) {
      try {
        // Vérifier si le service existe déjà
        const existingService = await prisma.service.findUnique({
          where: { slug: serviceData.slug }
        })

        let service

        if (existingService) {
          // Mettre à jour le service existant
          service = await prisma.service.update({
            where: { id: existingService.id },
            data: {
              ...serviceData,
              updatedAt: new Date()
            }
          })
          console.log(`🔄 Service mis à jour: ${serviceData.name}`)
          updatedCount++
        } else {
          // Créer le nouveau service (sans les images pour le moment)
          const { images, ...serviceWithoutImages } = serviceData
          service = await prisma.service.create({
            data: serviceWithoutImages
          })
          console.log(`✅ Service créé: ${serviceData.name}`)
          createdCount++
        }

        // Ajouter les images si fournies
        if (serviceData.images && serviceData.images.length > 0) {
          // Supprimer les images existantes
          await prisma.media.deleteMany({
            where: {
              services: {
                some: {
                  id: service.id
                }
              }
            }
          })

          // Créer les nouvelles images
          for (const imageUrl of serviceData.images) {
            const media = await prisma.media.create({
              data: {
                name: `${service.name} - Image`,
                fileName: imageUrl.split('/').pop() || 'image.jpg',
                mimeType: 'image/jpeg',
                path: imageUrl,
                size: 0, // Taille inconnue pour les URLs externes
                alt: `${service.name} - Image`,
                type: 'image',
              }
            })

            // Associer l'image au service
            await prisma.media.update({
              where: { id: media.id },
              data: {
                services: {
                  connect: {
                    id: service.id
                  }
                }
              }
            })
          }
          console.log(`   🖼️ ${serviceData.images.length} images ajoutées`)
        }

      } catch (error) {
        console.error(`❌ Erreur avec ${serviceData.name}:`, error.message)
        console.error('Détails:', error)
      }
    }

    console.log(`\n📊 Résumé:`)
    console.log(`   ✅ ${createdCount} services créés`)
    console.log(`   🔄 ${updatedCount} services mis à jour`)
    console.log(`   📁 ${categories.length} catégories disponibles`)

    console.log(`\n🎯 Services créés avec différents cas:`)
    console.log(`   💰 Prix: 0 Ar (gratuit) → 2,500,000 Ar (premium)`)
    console.log(`   ⏱️ Durée: 15 min (express) → 3 mois (projet complet)`)
    console.log(`   📂 Catégories: Maintenance, Installation, Consultation, Formation, Support`)
    console.log(`   🔒 Statuts: Publié / Brouillon`)
    console.log(`   🖼️ Images: Services avec 1 ou plusieurs images`)

    console.log(`\n✨ Services de test créés avec succès!`)
    console.log(`💡 Vous pouvez maintenant tester la page services avec différents cas d'usage.`)

  } catch (error) {
    console.error('❌ Erreur lors de la création des services:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestServices()

