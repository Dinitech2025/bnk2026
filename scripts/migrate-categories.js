const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migration des catégories vers les tables séparées...')

  try {
    // Vérifier s'il y a des données dans l'ancienne table Category
    const oldCategories = await prisma.$queryRaw`
      SELECT * FROM "Category" WHERE EXISTS (SELECT 1 FROM "Category")
    `.catch(() => [])

    if (oldCategories.length === 0) {
      console.log('ℹ️  Aucune ancienne catégorie trouvée, création de nouvelles données...')
      
      // Créer les catégories de services
      const beautyCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Beauté & Bien-être',
          slug: 'beaute-bien-etre',
          description: 'Services de beauté, soins esthétiques et bien-être',
          image: null
        }
      })

      const techCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Informatique & Technologie',
          slug: 'informatique-technologie',
          description: 'Services informatiques, développement et support technique',
          image: null
        }
      })

      const homeCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Maison & Jardin',
          slug: 'maison-jardin',
          description: 'Services pour la maison, jardinage et entretien',
          image: null
        }
      })

      const educationCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Éducation & Formation',
          slug: 'education-formation',
          description: 'Cours particuliers, formations et accompagnement scolaire',
          image: null
        }
      })

      // Créer des sous-catégories
      const webDevCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Développement Web',
          slug: 'developpement-web',
          description: 'Création de sites web, applications et e-commerce',
          parentId: techCategory.id,
          image: null
        }
      })

      const skinCareCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Soins du visage',
          slug: 'soins-visage',
          description: 'Nettoyage, hydratation et soins anti-âge',
          parentId: beautyCategory.id,
          image: null
        }
      })

      console.log('✅ Catégories de services créées')

      // Créer quelques catégories de produits pour l'exemple
      const electronicsCategory = await prisma.productCategory.create({
        data: {
          name: 'Électronique',
          slug: 'electronique',
          description: 'Appareils électroniques et accessoires',
          image: null
        }
      })

      const clothingCategory = await prisma.productCategory.create({
        data: {
          name: 'Vêtements',
          slug: 'vetements',
          description: 'Mode et accessoires vestimentaires',
          image: null
        }
      })

      console.log('✅ Catégories de produits créées')

      // Créer les services avec les nouvelles catégories
      const services = [
        {
          name: 'Soin du visage hydratant',
          slug: 'soin-visage-hydratant',
          description: 'Soin complet du visage avec nettoyage en profondeur, gommage doux et masque hydratant.',
          price: 65.00,
          duration: 60,
          categoryId: skinCareCategory.id,
          published: true
        },
        {
          name: 'Massage relaxant',
          slug: 'massage-relaxant',
          description: 'Massage complet du corps aux huiles essentielles pour une détente profonde.',
          price: 80.00,
          duration: 90,
          categoryId: beautyCategory.id,
          published: true
        },
        {
          name: 'Création de site web vitrine',
          slug: 'creation-site-web-vitrine',
          description: 'Développement d\'un site web professionnel responsive avec design moderne.',
          price: 1200.00,
          duration: 480,
          categoryId: webDevCategory.id,
          published: true
        },
        {
          name: 'Maintenance informatique',
          slug: 'maintenance-informatique',
          description: 'Diagnostic, nettoyage et optimisation de votre ordinateur.',
          price: 75.00,
          duration: 120,
          categoryId: techCategory.id,
          published: true
        },
        {
          name: 'Entretien de jardin',
          slug: 'entretien-jardin',
          description: 'Tonte de pelouse, taille des haies, désherbage et entretien général.',
          price: 45.00,
          duration: 120,
          categoryId: homeCategory.id,
          published: true
        },
        {
          name: 'Cours particuliers de mathématiques',
          slug: 'cours-maths',
          description: 'Soutien scolaire en mathématiques pour collège et lycée.',
          price: 30.00,
          duration: 60,
          categoryId: educationCategory.id,
          published: true
        }
      ]

      for (const serviceData of services) {
        await prisma.service.upsert({
          where: { slug: serviceData.slug },
          update: {},
          create: serviceData
        })
      }

      console.log('✅ Services créés avec les nouvelles catégories')
    }

    // Afficher les statistiques
    const serviceCategoriesCount = await prisma.serviceCategory.count()
    const productCategoriesCount = await prisma.productCategory.count()
    const servicesCount = await prisma.service.count()

    console.log('\n📊 Résumé de la migration :')
    console.log(`   - ${serviceCategoriesCount} catégories de services`)
    console.log(`   - ${productCategoriesCount} catégories de produits`)
    console.log(`   - ${servicesCount} services`)

    // Afficher les détails des catégories de services
    const serviceCategories = await prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: {
            services: true,
            children: true
          }
        }
      }
    })

    console.log('\n📋 Catégories de services :')
    serviceCategories.forEach(cat => {
      const indent = cat.parentId ? '  └─ ' : '• '
      console.log(`${indent}${cat.name}: ${cat._count.services} services, ${cat._count.children} sous-catégories`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 