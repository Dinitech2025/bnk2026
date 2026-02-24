const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker/locale/fr')
const slugify = require('slugify')

const prisma = new PrismaClient()

function createSlug(name) {
  return slugify(`${name}-${Date.now()}`, { lower: true, strict: true })
}

async function main() {
  console.log('🚀 Démarrage du seeding...')

  // --- Création des catégories de produits ---
  console.log('--- Création des catégories de produits ---')
  const productCategories = []
  for (let i = 0; i < 5; i++) {
    const categoryName = faker.commerce.department()
    try {
      const category = await prisma.productCategory.create({
        data: {
          name: categoryName,
          slug: createSlug(categoryName),
          description: `Catégorie pour ${categoryName}`,
        },
      })
      productCategories.push(category)
      console.log(`✅ Catégorie créée: ${category.name}`)
    } catch (e) {
      console.error(`Erreur création catégorie ${categoryName}:`, e.message)
    }
  }

  // --- Création des produits ---
  console.log('\n--- Création de 20 produits ---')
  for (let i = 0; i < 20; i++) {
    const productName = faker.commerce.productName()
    const price = parseFloat(faker.commerce.price({ min: 10000, max: 200000 }))
    try {
      await prisma.product.create({
        data: {
          name: productName,
          slug: createSlug(productName),
          description: faker.commerce.productDescription(),
          price: price,
          sku: faker.string.alphanumeric(10).toUpperCase(),
          inventory: faker.number.int({ min: 0, max: 100 }),
          featured: Math.random() > 0.8,
          categoryId: productCategories[Math.floor(Math.random() * productCategories.length)].id,
          images: {
            create: [{
              url: faker.image.urlLoremFlickr({ category: 'technics' }),
              altText: `Image pour ${productName}`,
              type: 'PRODUCT_IMAGE'
            }]
          }
        },
      })
      console.log(`  -> Produit créé: ${productName}`)
    } catch (e) {
      console.error(`Erreur création produit ${productName}:`, e.message)
    }
  }
  console.log('✅ 20 produits créés.')

  // --- Création des catégories de services ---
  console.log('\n--- Création des catégories de services ---')
  const serviceCategories = []
  for (let i = 0; i < 3; i++) {
    const categoryName = faker.lorem.words(2)
    try {
      const category = await prisma.serviceCategory.create({
        data: {
          name: `Service ${categoryName}`,
          slug: createSlug(categoryName),
          description: `Description pour les services de ${categoryName}`,
        },
      })
      serviceCategories.push(category)
      console.log(`✅ Catégorie de service créée: ${category.name}`)
    } catch (e) {
      console.error(`Erreur création catégorie service ${categoryName}:`, e.message)
    }
  }

  // --- Création des services ---
  console.log('\n--- Création de 10 services ---')
  for (let i = 0; i < 10; i++) {
    const serviceName = faker.lorem.sentence(3)
    try {
      await prisma.service.create({
        data: {
          name: serviceName,
          slug: createSlug(serviceName),
          description: faker.lorem.paragraph(),
          price: parseFloat(faker.commerce.price({ min: 50000, max: 500000 })),
          duration: faker.number.int({ min: 30, max: 180 }),
          categoryId: serviceCategories[Math.floor(Math.random() * serviceCategories.length)].id,
          images: {
            create: [{
              url: faker.image.urlLoremFlickr({ category: 'business' }),
              altText: `Image pour ${serviceName}`,
              type: 'SERVICE_IMAGE'
            }]
          }
        },
      })
      console.log(`  -> Service créé: ${serviceName}`)
    } catch (e) {
      console.error(`Erreur création service ${serviceName}:`, e.message)
    }
  }
  console.log('✅ 10 services créés.')
  
  // --- Création des plateformes et offres ---
  console.log("\n--- Création des plateformes et 5 offres d'abonnement ---")
  const platformNames = ['Netflix', 'Spotify', 'Disney+', 'Amazon Prime Video', 'YouTube Premium']
  for (const name of platformNames) {
    try {
      // 1. Créer la plateforme
      const platform = await prisma.platform.create({
        data: {
          name,
          slug: createSlug(name),
          description: `Abonnements et services pour ${name}`,
          logo: faker.image.urlLoremFlickr({ category: 'logo' }),
        }
      })
      console.log(` -> Plateforme créée: ${name}`)

      // 2. Créer l'offre associée
      const offerName = `Abonnement ${name} - Essentiel`
      await prisma.offer.create({
        data: {
          name: offerName,
          slug: createSlug(offerName),
          description: `Offre spéciale pour ${name}`,
          price: parseFloat(faker.commerce.price({ min: 20000, max: 80000 })),
          duration: 30,
          status: 'ACTIVE',
          platformId: platform.id, // Lier l'offre à la plateforme
          images: {
            create: [{
              url: faker.image.urlLoremFlickr({ category: 'movie' }),
              altText: `Image pour ${offerName}`,
              type: 'OFFER_IMAGE'
            }]
          }
        }
      })
      console.log(` -> Offre créée pour: ${name}`)

    } catch (e) {
      console.error(`Erreur création plateforme/offre pour ${name}:`, e.message)
    }
  }
  console.log("✅ Plateformes et offres créées.")

  console.log('\n🎉 Seeding terminé!')
}

main()
  .catch((e) => {
    console.error("Erreur fatale pendant le seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 