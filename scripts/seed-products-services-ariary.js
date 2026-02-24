const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🏷️ Ajout de produits et services avec prix en MGA...')

  try {
    // Créer des catégories de produits si elles n'existent pas
    const electronicsCategory = await prisma.productCategory.upsert({
      where: { slug: 'electronique' },
      update: {},
      create: {
        name: 'Électronique',
        slug: 'electronique',
        description: 'Appareils électroniques et accessoires high-tech',
        image: null
      }
    })

    const clothingCategory = await prisma.productCategory.upsert({
      where: { slug: 'vetements' },
      update: {},
      create: {
        name: 'Vêtements',
        slug: 'vetements',
        description: 'Vêtements et accessoires de mode',
        image: null
      }
    })

    const homeCategory = await prisma.productCategory.upsert({
      where: { slug: 'maison-jardin' },
      update: {},
      create: {
        name: 'Maison & Jardin',
        slug: 'maison-jardin',
        description: 'Articles pour la maison et le jardin',
        image: null
      }
    })

    const beautyCategory = await prisma.productCategory.upsert({
      where: { slug: 'beaute-sante' },
      update: {},
      create: {
        name: 'Beauté & Santé',
        slug: 'beaute-sante',
        description: 'Produits de beauté et de santé',
        image: null
      }
    })

    console.log('✅ Catégories de produits créées')

    // Produits avec prix en MGA (devise de base du système)
    const products = [
      // Produits locaux/simples
      {
        name: 'T-shirt en coton bio',
        slug: 't-shirt-coton-bio',
        description: 'T-shirt 100% coton biologique, fabriqué localement à Madagascar',
        sku: 'TSH-COT-001',
        price: 45000, // 45 000 MGA
        inventory: 50,
        published: true,
        categoryId: clothingCategory.id
      },
      {
        name: 'Savon artisanal au miel',
        slug: 'savon-artisanal-miel',
        description: 'Savon naturel au miel de Madagascar, fait à la main',
        sku: 'SAV-MIE-001',
        price: 12000, // 12 000 MGA
        inventory: 100,
        published: true,
        categoryId: beautyCategory.id
      },
      {
        name: 'Panier en raphia tressé',
        slug: 'panier-raphia-tresse',
        description: 'Panier traditionnel malgache en raphia tressé à la main',
        sku: 'PAN-RAP-001',
        price: 35000, // 35 000 MGA
        inventory: 25,
        published: true,
        categoryId: homeCategory.id
      },
      {
        name: 'Huile essentielle d\'ylang-ylang',
        slug: 'huile-essentielle-ylang-ylang',
        description: 'Huile essentielle pure d\'ylang-ylang de Nosy Be - 10ml',
        sku: 'HUI-YLA-001',
        price: 85000, // 85 000 MGA
        inventory: 30,
        published: true,
        categoryId: beautyCategory.id
      },
      {
        name: 'Chemise en lin blanc',
        slug: 'chemise-lin-blanc',
        description: 'Chemise élégante en lin naturel, parfaite pour le climat tropical',
        sku: 'CHE-LIN-001',
        price: 125000, // 125 000 MGA
        inventory: 20,
        published: true,
        categoryId: clothingCategory.id
      },

      // Produits importés
      {
        name: 'Smartphone Samsung Galaxy A54',
        slug: 'smartphone-samsung-galaxy-a54',
        description: 'Smartphone Samsung Galaxy A54 5G - 128GB - Importé',
        sku: 'SMT-SAM-A54',
        price: 1530000, // 1 530 000 MGA (~300 EUR)
        compareAtPrice: 1700000, // Prix barré
        inventory: 15,
        published: true,
        categoryId: electronicsCategory.id
      },
      {
        name: 'Casque Bluetooth Sony WH-CH720N',
        slug: 'casque-bluetooth-sony-wh-ch720n',
        description: 'Casque sans fil Sony avec réduction de bruit active',
        sku: 'CAS-SON-720N',
        price: 765000, // 765 000 MGA (~150 EUR)
        inventory: 25,
        published: true,
        categoryId: electronicsCategory.id
      },
      {
        name: 'Montre connectée Apple Watch SE',
        slug: 'montre-connectee-apple-watch-se',
        description: 'Apple Watch SE 2ème génération - GPS - 40mm',
        sku: 'MON-APP-SE',
        price: 1275000, // 1 275 000 MGA (~250 EUR)
        inventory: 10,
        published: true,
        categoryId: electronicsCategory.id
      },
      {
        name: 'Aspirateur robot Xiaomi Mi Robot',
        slug: 'aspirateur-robot-xiaomi-mi-robot',
        description: 'Aspirateur robot intelligent Xiaomi avec navigation laser',
        sku: 'ASP-XIA-ROB',
        price: 1020000, // 1 020 000 MGA (~200 EUR)
        inventory: 8,
        published: true,
        categoryId: homeCategory.id
      },
      {
        name: 'Machine à café Nespresso Vertuo',
        slug: 'machine-cafe-nespresso-vertuo',
        description: 'Machine à café Nespresso Vertuo avec technologie Centrifusion',
        sku: 'CAF-NES-VER',
        price: 612000, // 612 000 MGA (~120 EUR)
        inventory: 12,
        published: true,
        categoryId: homeCategory.id
      },
      {
        name: 'Parfum Chanel N°5 - 100ml',
        slug: 'parfum-chanel-n5-100ml',
        description: 'Parfum iconique Chanel N°5 - Eau de Parfum 100ml',
        sku: 'PAR-CHA-N5',
        price: 765000, // 765 000 MGA (~150 EUR)
        inventory: 6,
        published: true,
        categoryId: beautyCategory.id
      }
    ]

    // Créer les produits
    for (const productData of products) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku }
      })

      if (!existingProduct) {
        await prisma.product.create({
          data: productData
        })
        console.log(`✅ Produit créé: ${productData.name} - ${productData.price.toLocaleString()} MGA`)
      } else {
        console.log(`⚠️ Produit existant: ${productData.name}`)
      }
    }

    // Créer des catégories de services si elles n'existent pas
    const beautyServiceCategory = await prisma.serviceCategory.upsert({
      where: { slug: 'beaute-bien-etre' },
      update: {},
      create: {
        name: 'Beauté & Bien-être',
        slug: 'beaute-bien-etre',
        description: 'Services de beauté et de bien-être'
      }
    })

    const techServiceCategory = await prisma.serviceCategory.upsert({
      where: { slug: 'informatique-technologie' },
      update: {},
      create: {
        name: 'Informatique & Technologie',
        slug: 'informatique-technologie',
        description: 'Services informatiques et technologiques'
      }
    })

    const homeServiceCategory = await prisma.serviceCategory.upsert({
      where: { slug: 'maison-jardin-services' },
      update: {},
      create: {
        name: 'Maison & Jardin',
        slug: 'maison-jardin-services',
        description: 'Services pour la maison et le jardin'
      }
    })

    const educationServiceCategory = await prisma.serviceCategory.upsert({
      where: { slug: 'education-formation' },
      update: {},
      create: {
        name: 'Éducation & Formation',
        slug: 'education-formation',
        description: 'Services d\'éducation et de formation'
      }
    })

    console.log('✅ Catégories de services créées')

    // Services avec prix en MGA
    const services = [
      // Services existants mis à jour
      {
        name: 'Soin du visage hydratant',
        slug: 'soin-visage-hydratant',
        description: 'Soin complet du visage avec masque hydratant et massage relaxant',
        price: 325000, // 325 000 MGA (~65 EUR)
        duration: 90,
        published: true,
        categoryId: beautyServiceCategory.id
      },
      {
        name: 'Massage relaxant',
        slug: 'massage-relaxant',
        description: 'Massage complet du corps aux huiles essentielles malgaches',
        price: 400000, // 400 000 MGA (~80 EUR)
        duration: 60,
        published: true,
        categoryId: beautyServiceCategory.id
      },
      {
        name: 'Création de site web vitrine',
        slug: 'creation-site-web-vitrine',
        description: 'Création d\'un site web professionnel avec design responsive',
        price: 6120000, // 6 120 000 MGA (~1200 EUR)
        duration: 2880, // 48h
        published: true,
        categoryId: techServiceCategory.id
      },
      {
        name: 'Maintenance informatique',
        slug: 'maintenance-informatique',
        description: 'Service de maintenance et réparation d\'ordinateurs',
        price: 382500, // 382 500 MGA (~75 EUR)
        duration: 120,
        published: true,
        categoryId: techServiceCategory.id
      },
      {
        name: 'Entretien de jardin',
        slug: 'entretien-jardin',
        description: 'Service d\'entretien complet de jardin et espaces verts',
        price: 229500, // 229 500 MGA (~45 EUR)
        duration: 240,
        published: true,
        categoryId: homeServiceCategory.id
      },
      {
        name: 'Cours particuliers de mathématiques',
        slug: 'cours-particuliers-mathematiques',
        description: 'Cours particuliers de mathématiques tous niveaux',
        price: 153000, // 153 000 MGA (~30 EUR)
        duration: 60,
        published: true,
        categoryId: educationServiceCategory.id
      },

      // Nouveaux services
      {
        name: 'Coiffure et brushing',
        slug: 'coiffure-brushing',
        description: 'Service de coiffure professionnel avec brushing',
        price: 76500, // 76 500 MGA (~15 EUR)
        duration: 45,
        published: true,
        categoryId: beautyServiceCategory.id
      },
      {
        name: 'Réparation smartphone',
        slug: 'reparation-smartphone',
        description: 'Réparation et diagnostic de smartphones toutes marques',
        price: 255000, // 255 000 MGA (~50 EUR)
        duration: 90,
        published: true,
        categoryId: techServiceCategory.id
      },
      {
        name: 'Livraison à domicile',
        slug: 'livraison-domicile',
        description: 'Service de livraison rapide dans Antananarivo',
        price: 25500, // 25 500 MGA (~5 EUR)
        duration: 30,
        published: true,
        categoryId: homeServiceCategory.id
      }
    ]

    // Créer les services
    for (const serviceData of services) {
      const existingService = await prisma.service.findUnique({
        where: { slug: serviceData.slug }
      })

      if (!existingService) {
        await prisma.service.create({
          data: serviceData
        })
        console.log(`✅ Service créé: ${serviceData.name} - ${serviceData.price.toLocaleString()} MGA`)
      } else {
        // Mettre à jour le prix si le service existe
        await prisma.service.update({
          where: { slug: serviceData.slug },
          data: { 
            price: serviceData.price,
            categoryId: serviceData.categoryId
          }
        })
        console.log(`🔄 Service mis à jour: ${serviceData.name} - ${serviceData.price.toLocaleString()} MGA`)
      }
    }

    console.log('\n🎉 Tous les produits et services ont été ajoutés/mis à jour avec des prix en MGA!')
    console.log('💡 Les prix s\'afficheront automatiquement dans la devise sélectionnée grâce au système de conversion existant.')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  }) 