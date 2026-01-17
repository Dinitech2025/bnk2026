const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDemoData() {
  try {
    console.log('🚀 Création des données de démonstration...');

    // 1. Créer des catégories de produits
    console.log('\n📁 Création des catégories de produits...');
    
    const productCategories = await Promise.all([
      prisma.productCategory.upsert({
        where: { slug: 'electronique' },
        update: {},
        create: {
          name: 'Électronique',
          slug: 'electronique',
          description: 'Appareils électroniques et gadgets',
          isVisible: true
        }
      }),
      prisma.productCategory.upsert({
        where: { slug: 'vetements' },
        update: {},
        create: {
          name: 'Vêtements',
          slug: 'vetements',
          description: 'Mode et accessoires',
          isVisible: true
        }
      }),
      prisma.productCategory.upsert({
        where: { slug: 'maison' },
        update: {},
        create: {
          name: 'Maison & Jardin',
          slug: 'maison',
          description: 'Articles pour la maison et le jardin',
          isVisible: true
        }
      })
    ]);

    console.log(`✅ ${productCategories.length} catégories de produits créées`);

    // 2. Créer des catégories de services
    console.log('\n📁 Création des catégories de services...');
    
    const serviceCategories = await Promise.all([
      prisma.serviceCategory.upsert({
        where: { slug: 'informatique' },
        update: {},
        create: {
          name: 'Informatique',
          slug: 'informatique',
          description: 'Services informatiques et techniques'
        }
      }),
      prisma.serviceCategory.upsert({
        where: { slug: 'design' },
        update: {},
        create: {
          name: 'Design & Créatif',
          slug: 'design',
          description: 'Services de design et création'
        }
      }),
      prisma.serviceCategory.upsert({
        where: { slug: 'consultation' },
        update: {},
        create: {
          name: 'Consultation',
          slug: 'consultation',
          description: 'Services de conseil et consultation'
        }
      })
    ]);

    console.log(`✅ ${serviceCategories.length} catégories de services créées`);

    // 3. Créer des produits avec tous les types de tarification
    console.log('\n🛍️ Création des produits de démonstration...');
    
    const products = [
      // FIXED - Prix fixe
      {
        name: 'Smartphone Galaxy Pro',
        slug: 'smartphone-galaxy-pro',
        description: 'Smartphone haut de gamme avec écran OLED 6.7" et appareil photo 108MP. Livré avec chargeur rapide et étui de protection.',
        price: 850000,
        compareAtPrice: 950000,
        sku: 'PHONE-GAL-PRO-001',
        inventory: 25,
        categoryId: productCategories[0].id,
        pricingType: 'FIXED',
        published: true,
        featured: true
      },
      
      // RANGE - Plage de prix
      {
        name: 'Ordinateur Portable Gaming',
        slug: 'ordinateur-portable-gaming',
        description: 'PC portable gaming personnalisable avec processeur Intel i7, carte graphique RTX 4060, RAM 16GB. Configuration adaptable selon vos besoins.',
        price: 1200000,
        minPrice: 1000000,
        maxPrice: 1500000,
        sku: 'LAPTOP-GAMING-001',
        inventory: 15,
        categoryId: productCategories[0].id,
        pricingType: 'RANGE',
        autoAcceptNegotiation: true,
        published: true
      },
      
      // NEGOTIABLE - Prix négociable
      {
        name: 'Canapé 3 Places Cuir',
        slug: 'canape-3-places-cuir',
        description: 'Canapé en cuir véritable 3 places, couleur marron, très confortable. Parfait pour salon moderne. Possibilité de négociation sur le prix.',
        price: 750000,
        sku: 'SOFA-LEATHER-3P-001',
        inventory: 8,
        categoryId: productCategories[2].id,
        pricingType: 'NEGOTIABLE',
        published: true
      },
      
      // QUOTE_REQUIRED - Sur devis uniquement
      {
        name: 'Cuisine Équipée Sur Mesure',
        slug: 'cuisine-equipee-sur-mesure',
        description: 'Cuisine complète sur mesure avec électroménager intégré. Design personnalisé selon vos dimensions et goûts. Devis gratuit sur demande.',
        price: 2000000,
        sku: 'KITCHEN-CUSTOM-001',
        inventory: 0,
        categoryId: productCategories[2].id,
        pricingType: 'QUOTE_REQUIRED',
        requiresQuote: true,
        published: true
      },
      
      // AUCTION - Enchères
      {
        name: 'Montre Vintage Collection',
        slug: 'montre-vintage-collection',
        description: 'Montre vintage rare des années 1960, mécanisme automatique, bracelet cuir d\'origine. Pièce de collection authentifiée.',
        price: 500000,
        minimumBid: 300000,
        currentHighestBid: 350000,
        auctionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        sku: 'WATCH-VINTAGE-001',
        inventory: 1,
        categoryId: productCategories[1].id,
        pricingType: 'AUCTION',
        published: true,
        featured: true
      },
      
      // Produits supplémentaires
      {
        name: 'T-Shirt Premium Coton Bio',
        slug: 't-shirt-premium-coton-bio',
        description: 'T-shirt en coton bio 100%, coupe moderne, disponible en plusieurs couleurs. Matière douce et respirante.',
        price: 25000,
        compareAtPrice: 35000,
        sku: 'TSHIRT-BIO-001',
        inventory: 50,
        categoryId: productCategories[1].id,
        pricingType: 'FIXED',
        published: true
      },
      
      {
        name: 'Table Basse Design Moderne',
        slug: 'table-basse-design-moderne',
        description: 'Table basse en verre trempé avec pieds en métal chromé. Design épuré et moderne pour salon contemporain.',
        price: 180000,
        minPrice: 150000,
        maxPrice: 220000,
        sku: 'TABLE-MODERN-001',
        inventory: 12,
        categoryId: productCategories[2].id,
        pricingType: 'RANGE',
        autoAcceptNegotiation: false,
        published: true
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await prisma.product.create({
        data: productData
      });
      createdProducts.push(product);
      console.log(`✅ Produit créé: ${product.name} (${product.pricingType})`);
    }

    // 4. Créer des services avec tous les types de tarification
    console.log('\n🔧 Création des services de démonstration...');
    
    const services = [
      // FIXED - Prix fixe
      {
        name: 'Réparation Smartphone',
        slug: 'reparation-smartphone',
        description: 'Réparation professionnelle de smartphones : écran cassé, batterie, boutons. Diagnostic gratuit, réparation en 2h.',
        price: 45000,
        duration: 120, // 2 heures
        categoryId: serviceCategories[0].id,
        pricingType: 'FIXED',
        published: true
      },
      
      // RANGE - Plage de prix
      {
        name: 'Développement Site Web',
        slug: 'developpement-site-web',
        description: 'Création de site web responsive et moderne. Prix variable selon la complexité : site vitrine, e-commerce, ou application web.',
        price: 500000,
        minPrice: 300000,
        maxPrice: 1200000,
        duration: 2160, // 36 heures
        categoryId: serviceCategories[0].id,
        pricingType: 'RANGE',
        autoAcceptNegotiation: true,
        published: true
      },
      
      // NEGOTIABLE - Prix négociable
      {
        name: 'Design Logo & Identité Visuelle',
        slug: 'design-logo-identite-visuelle',
        description: 'Création de logo professionnel et charte graphique complète. Plusieurs propositions, révisions incluses. Prix négociable selon le projet.',
        price: 150000,
        duration: 480, // 8 heures
        categoryId: serviceCategories[1].id,
        pricingType: 'NEGOTIABLE',
        published: true
      },
      
      // QUOTE_REQUIRED - Sur devis uniquement
      {
        name: 'Consultation Stratégie Digitale',
        slug: 'consultation-strategie-digitale',
        description: 'Audit complet et stratégie digitale personnalisée pour votre entreprise. Analyse concurrentielle, plan d\'action détaillé.',
        price: 200000,
        duration: 960, // 16 heures
        categoryId: serviceCategories[2].id,
        pricingType: 'QUOTE_REQUIRED',
        requiresQuote: true,
        published: true
      },
      
      // Services supplémentaires
      {
        name: 'Formation Informatique Personnalisée',
        slug: 'formation-informatique-personnalisee',
        description: 'Formation individuelle ou en groupe sur les outils informatiques : bureautique, internet, réseaux sociaux.',
        price: 35000,
        duration: 180, // 3 heures
        categoryId: serviceCategories[0].id,
        pricingType: 'FIXED',
        published: true
      },
      
      {
        name: 'Création Vidéo Promotionnelle',
        slug: 'creation-video-promotionnelle',
        description: 'Réalisation de vidéo promotionnelle pour votre entreprise : tournage, montage, effets spéciaux. Durée et complexité variables.',
        price: 400000,
        minPrice: 250000,
        maxPrice: 800000,
        duration: 1440, // 24 heures
        categoryId: serviceCategories[1].id,
        pricingType: 'RANGE',
        autoAcceptNegotiation: false,
        published: true
      }
    ];

    const createdServices = [];
    for (const serviceData of services) {
      const service = await prisma.service.create({
        data: serviceData
      });
      createdServices.push(service);
      console.log(`✅ Service créé: ${service.name} (${service.pricingType})`);
    }

    // 5. Résumé
    console.log('\n🎉 Création terminée !');
    console.log('\n📊 Résumé des données créées:');
    console.log(`📁 Catégories produits: ${productCategories.length}`);
    console.log(`📁 Catégories services: ${serviceCategories.length}`);
    console.log(`🛍️ Produits: ${createdProducts.length}`);
    console.log(`🔧 Services: ${createdServices.length}`);
    
    console.log('\n🏷️ Types de tarification créés:');
    console.log('📦 PRODUITS:');
    console.log('  ✅ FIXED (Prix fixe): Smartphone, T-shirt');
    console.log('  ✅ RANGE (Plage): Laptop Gaming, Table Basse');
    console.log('  ✅ NEGOTIABLE (Négociable): Canapé Cuir');
    console.log('  ✅ QUOTE_REQUIRED (Devis): Cuisine Sur Mesure');
    console.log('  ✅ AUCTION (Enchères): Montre Vintage');
    
    console.log('🔧 SERVICES:');
    console.log('  ✅ FIXED (Prix fixe): Réparation Smartphone, Formation');
    console.log('  ✅ RANGE (Plage): Développement Web, Vidéo Promo');
    console.log('  ✅ NEGOTIABLE (Négociable): Design Logo');
    console.log('  ✅ QUOTE_REQUIRED (Devis): Consultation Stratégie');

    console.log('\n🌐 Accès aux données:');
    console.log('🏠 Page d\'accueil: http://localhost:3000');
    console.log('🛍️ Produits: http://localhost:3000/products');
    console.log('🔧 Services: http://localhost:3000/services');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData();



