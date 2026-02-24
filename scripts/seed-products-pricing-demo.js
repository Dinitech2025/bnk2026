const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProductsPricingDemo() {
  console.log('🎨 Création de produits de démonstration pour tous les types de tarification...\n')

  try {
    // Vérifier/créer une catégorie de démonstration
    let demoCategory = await prisma.productCategory.findFirst({
      where: { slug: 'demo-tarification' }
    })

    if (!demoCategory) {
      demoCategory = await prisma.productCategory.create({
        data: {
          name: 'Démo Tarification',
          slug: 'demo-tarification',
          description: 'Produits de démonstration pour tous les types de tarification',
          isVisible: true
        }
      })
      console.log('✅ Catégorie de démonstration créée')
    }

    // 1️⃣ PRODUIT PRIX FIXE
    console.log('\n1️⃣ Création produit PRIX FIXE...')
    const productFixed = await prisma.product.upsert({
      where: { slug: 'tshirt-boutiknaka-demo' },
      update: {},
      create: {
        name: 'T-shirt BoutikNaka [PRIX FIXE]',
        slug: 'tshirt-boutiknaka-demo',
        description: '🔵 Exemple de produit avec PRIX FIXE\n\n- Prix standard non négociable\n- Ajout direct au panier\n- Idéal pour les produits standards',
        price: 25000,
        compareAtPrice: 30000,
        sku: 'DEMO-FIXED-001',
        inventory: 0, // Sera calculé automatiquement
        categoryId: demoCategory.id,
        published: true,
        featured: true,
        pricingType: 'FIXED',
        requiresQuote: false,
        autoAcceptNegotiation: false
      }
    })

    // Ajouter des variations pour le T-shirt
    const tshirtVariations = [
      { size: 'S', inventory: 30, price: 25000 },
      { size: 'M', inventory: 40, price: 25000 },
      { size: 'L', inventory: 30, price: 25000 }
    ]

    for (const variation of tshirtVariations) {
      await prisma.productVariation.upsert({
        where: { sku: `${productFixed.sku}-${variation.size}` },
        update: {
          inventory: variation.inventory,
          price: variation.price
        },
        create: {
          sku: `${productFixed.sku}-${variation.size}`,
          price: variation.price,
          inventory: variation.inventory,
          productId: productFixed.id,
          attributes: {
            create: [
              { name: 'taille', value: variation.size }
            ]
          }
        }
      })
    }

    const totalStock1 = tshirtVariations.reduce((sum, v) => sum + v.inventory, 0)
    await prisma.product.update({
      where: { id: productFixed.id },
      data: { inventory: totalStock1 }
    })

    console.log(`   ✅ T-shirt créé avec ${tshirtVariations.length} variations`)
    console.log(`   📦 Stock automatique: ${totalStock1} unités`)

    // 2️⃣ PRODUIT PLAGE DE PRIX
    console.log('\n2️⃣ Création produit PLAGE DE PRIX...')
    const productRange = await prisma.product.upsert({
      where: { slug: 'smartphone-x-demo' },
      update: {},
      create: {
        name: 'Smartphone X [PLAGE DE PRIX]',
        slug: 'smartphone-x-demo',
        description: '🟢 Exemple de produit avec PLAGE DE PRIX\n\n- Le client peut proposer un prix entre 480k et 520k Ar\n- Auto-acceptation activée\n- Idéal pour les produits avec marges flexibles\n\nCaractéristiques:\n- Écran 6.5" AMOLED\n- 128GB de stockage\n- Garantie 1 an',
        price: 500000,
        compareAtPrice: 550000,
        sku: 'DEMO-RANGE-001',
        inventory: 0,
        categoryId: demoCategory.id,
        published: true,
        featured: true,
        pricingType: 'RANGE',
        minPrice: 480000,
        maxPrice: 520000,
        requiresQuote: false,
        autoAcceptNegotiation: true
      }
    })

    // Ajouter des variations pour le Smartphone (couleurs)
    const phoneVariations = [
      { color: 'Noir', inventory: 8, price: 500000 },
      { color: 'Blanc', inventory: 6, price: 500000 },
      { color: 'Bleu', inventory: 4, price: 510000 }
    ]

    for (const variation of phoneVariations) {
      await prisma.productVariation.upsert({
        where: { sku: `${productRange.sku}-${variation.color.toUpperCase()}` },
        update: {
          inventory: variation.inventory,
          price: variation.price
        },
        create: {
          sku: `${productRange.sku}-${variation.color.toUpperCase()}`,
          price: variation.price,
          inventory: variation.inventory,
          productId: productRange.id,
          attributes: {
            create: [
              { name: 'couleur', value: variation.color }
            ]
          }
        }
      })
    }

    const totalStock2 = phoneVariations.reduce((sum, v) => sum + v.inventory, 0)
    await prisma.product.update({
      where: { id: productRange.id },
      data: { inventory: totalStock2 }
    })

    console.log(`   ✅ Smartphone créé avec ${phoneVariations.length} variations`)
    console.log(`   📦 Stock automatique: ${totalStock2} unités`)
    console.log(`   💰 Plage: ${productRange.minPrice} - ${productRange.maxPrice} Ar`)
    console.log(`   ⚡ Auto-acceptation: ${productRange.autoAcceptNegotiation ? 'OUI' : 'NON'}`)

    // 3️⃣ PRODUIT NÉGOCIABLE
    console.log('\n3️⃣ Création produit NÉGOCIABLE...')
    const productNegotiable = await prisma.product.upsert({
      where: { slug: 'laptop-pro-demo' },
      update: {},
      create: {
        name: 'Laptop Pro [NÉGOCIABLE]',
        slug: 'laptop-pro-demo',
        description: '🟡 Exemple de produit avec PRIX NÉGOCIABLE\n\n- Le client peut proposer n\'importe quel prix\n- Validation manuelle par l\'admin\n- Idéal pour les gros achats et le B2B\n\nSpécifications:\n- Processeur Intel i7\n- 16GB RAM\n- SSD 512GB\n- Écran 15.6" Full HD\n- Garantie 2 ans',
        price: 2000000,
        compareAtPrice: 2200000,
        sku: 'DEMO-NEGO-001',
        inventory: 0,
        categoryId: demoCategory.id,
        published: true,
        featured: true,
        pricingType: 'NEGOTIABLE',
        requiresQuote: true,
        autoAcceptNegotiation: false
      }
    })

    // Ajouter des variations pour le Laptop (configurations)
    const laptopVariations = [
      { config: 'Standard', ram: '16GB', storage: '512GB', inventory: 3, price: 2000000 },
      { config: 'Pro', ram: '32GB', storage: '1TB', inventory: 2, price: 2500000 }
    ]

    for (const variation of laptopVariations) {
      await prisma.productVariation.upsert({
        where: { sku: `${productNegotiable.sku}-${variation.config.toUpperCase()}` },
        update: {
          inventory: variation.inventory,
          price: variation.price
        },
        create: {
          sku: `${productNegotiable.sku}-${variation.config.toUpperCase()}`,
          price: variation.price,
          inventory: variation.inventory,
          productId: productNegotiable.id,
          attributes: {
            create: [
              { name: 'configuration', value: variation.config },
              { name: 'ram', value: variation.ram },
              { name: 'stockage', value: variation.storage }
            ]
          }
        }
      })
    }

    const totalStock3 = laptopVariations.reduce((sum, v) => sum + v.inventory, 0)
    await prisma.product.update({
      where: { id: productNegotiable.id },
      data: { inventory: totalStock3 }
    })

    console.log(`   ✅ Laptop créé avec ${laptopVariations.length} variations`)
    console.log(`   📦 Stock automatique: ${totalStock3} unités`)
    console.log(`   💬 Devis requis: ${productNegotiable.requiresQuote ? 'OUI' : 'NON'}`)

    // 4️⃣ PRODUIT SUR DEVIS
    console.log('\n4️⃣ Création produit SUR DEVIS...')
    const productQuote = await prisma.product.upsert({
      where: { slug: 'pc-gaming-custom-demo' },
      update: {},
      create: {
        name: 'PC Gaming Sur Mesure [SUR DEVIS]',
        slug: 'pc-gaming-custom-demo',
        description: '🟣 Exemple de produit SUR DEVIS UNIQUEMENT\n\n- Aucun prix affiché au client\n- Le client décrit ses besoins spécifiques\n- L\'admin prépare un devis personnalisé\n- Idéal pour les produits configurables ou sur mesure\n\nOptions disponibles:\n- Processeurs: Intel i5/i7/i9, AMD Ryzen\n- GPU: RTX 3060/3070/3080/4090\n- RAM: 16GB à 128GB\n- Stockage: SSD 500GB à 4TB\n- Boîtier et refroidissement personnalisés\n- RGB et accessoires gaming',
        price: 0, // Prix non affiché
        sku: 'DEMO-QUOTE-001',
        inventory: 999, // Stock illimité pour produits sur mesure
        categoryId: demoCategory.id,
        published: true,
        featured: true,
        pricingType: 'QUOTE_REQUIRED',
        requiresQuote: true,
        autoAcceptNegotiation: false
      }
    })

    console.log(`   ✅ PC Gaming Custom créé`)
    console.log(`   🎨 Type: SUR DEVIS (pas de prix affiché)`)
    console.log(`   📋 Devis requis: ${productQuote.requiresQuote ? 'OUI' : 'NON'}`)

    // 5️⃣ PRODUIT SIMPLE SANS VARIATIONS (PRIX FIXE)
    console.log('\n5️⃣ Création produit simple SANS VARIATIONS...')
    const productSimple = await prisma.product.upsert({
      where: { slug: 'souris-gaming-demo' },
      update: {},
      create: {
        name: 'Souris Gaming [SIMPLE]',
        slug: 'souris-gaming-demo',
        description: '🔵 Produit simple avec PRIX FIXE sans variations\n\n- Gestion de stock manuelle\n- Pas de variations de taille ou couleur\n- Prix fixe standard\n\nCaractéristiques:\n- DPI ajustable (800-16000)\n- 6 boutons programmables\n- RGB customisable\n- Garantie 1 an',
        price: 75000,
        compareAtPrice: 85000,
        sku: 'DEMO-SIMPLE-001',
        inventory: 50, // Stock manuel
        categoryId: demoCategory.id,
        published: true,
        pricingType: 'FIXED',
        requiresQuote: false,
        autoAcceptNegotiation: false
      }
    })

    console.log(`   ✅ Souris Gaming créée`)
    console.log(`   📦 Stock manuel: ${productSimple.inventory} unités`)
    console.log(`   ℹ️  Sans variations (stock géré manuellement)`)

    // 6️⃣ PRODUIT B2B AVEC VOLUME
    console.log('\n6️⃣ Création produit B2B AVEC VOLUME...')
    const productB2B = await prisma.product.upsert({
      where: { slug: 'lot-ordinateurs-bureau-demo' },
      update: {},
      create: {
        name: 'Lot Ordinateurs de Bureau [B2B]',
        slug: 'lot-ordinateurs-bureau-demo',
        description: '🟡 Produit B2B avec PRIX NÉGOCIABLE pour gros volumes\n\n- Remises sur quantité\n- Prix unitaire négociable selon le volume\n- Idéal pour entreprises et écoles\n\nConfiguration standard:\n- Intel Core i5\n- 8GB RAM\n- SSD 256GB\n- Windows 11 Pro\n- Écran 24" inclus\n- Clavier/Souris\n\nVolumes disponibles: 10, 25, 50, 100+ unités',
        price: 1200000, // Prix unitaire de base
        compareAtPrice: 1400000,
        sku: 'DEMO-B2B-001',
        inventory: 0,
        categoryId: demoCategory.id,
        published: true,
        pricingType: 'NEGOTIABLE',
        requiresQuote: true,
        autoAcceptNegotiation: false
      }
    })

    // Variations par volume (différents lots)
    const b2bVariations = [
      { volume: '10 unités', inventory: 5, price: 1200000 },
      { volume: '25 unités', inventory: 3, price: 1150000 },
      { volume: '50 unités', inventory: 2, price: 1100000 },
      { volume: '100+ unités', inventory: 1, price: 1050000 }
    ]

    for (const variation of b2bVariations) {
      await prisma.productVariation.upsert({
        where: { sku: `${productB2B.sku}-${variation.volume.replace(/\s+/g, '-')}` },
        update: {
          inventory: variation.inventory,
          price: variation.price
        },
        create: {
          sku: `${productB2B.sku}-${variation.volume.replace(/\s+/g, '-')}`,
          price: variation.price,
          inventory: variation.inventory,
          productId: productB2B.id,
          attributes: {
            create: [
              { name: 'volume', value: variation.volume }
            ]
          }
        }
      })
    }

    const totalStock6 = b2bVariations.reduce((sum, v) => sum + v.inventory, 0)
    await prisma.product.update({
      where: { id: productB2B.id },
      data: { inventory: totalStock6 }
    })

    console.log(`   ✅ Lot B2B créé avec ${b2bVariations.length} variations de volume`)
    console.log(`   📦 Stock automatique: ${totalStock6} lots disponibles`)

    // Résumé final
    console.log('\n' + '='.repeat(60))
    console.log('✨ RÉSUMÉ DES PRODUITS DE DÉMONSTRATION CRÉÉS')
    console.log('='.repeat(60))
    console.log('\n1️⃣  T-shirt BoutikNaka [PRIX FIXE]')
    console.log('   └─ Stock auto: 100 unités (3 tailles)')
    console.log('   └─ Prix: 25 000 Ar (fixe)')
    
    console.log('\n2️⃣  Smartphone X [PLAGE DE PRIX]')
    console.log('   └─ Stock auto: 18 unités (3 couleurs)')
    console.log('   └─ Plage: 480k - 520k Ar (auto-accept)')
    
    console.log('\n3️⃣  Laptop Pro [NÉGOCIABLE]')
    console.log('   └─ Stock auto: 5 unités (2 configs)')
    console.log('   └─ Prix: 2M Ar (négociable, devis requis)')
    
    console.log('\n4️⃣  PC Gaming Custom [SUR DEVIS]')
    console.log('   └─ Stock: Illimité (sur mesure)')
    console.log('   └─ Prix: Non affiché (devis uniquement)')
    
    console.log('\n5️⃣  Souris Gaming [SIMPLE]')
    console.log('   └─ Stock manuel: 50 unités')
    console.log('   └─ Prix: 75 000 Ar (fixe, sans variations)')
    
    console.log('\n6️⃣  Lot Ordinateurs Bureau [B2B]')
    console.log('   └─ Stock auto: 11 lots (4 volumes)')
    console.log('   └─ Prix: 1.2M Ar/unité (négociable par volume)')

    console.log('\n' + '='.repeat(60))
    console.log('🎯 ACCÉDER AUX PRODUITS')
    console.log('='.repeat(60))
    console.log('\n📱 Admin: http://localhost:3000/admin/products')
    console.log('🛍️  Site:  http://localhost:3000/categories/demo-tarification')
    console.log('\n✅ Tous les produits sont publiés et visibles !')

  } catch (error) {
    console.error('❌ Erreur lors de la création des produits:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
seedProductsPricingDemo()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès !\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur:', error)
    process.exit(1)
  })




