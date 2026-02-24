const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Taux de change approximatifs (1 EUR = 5100 MGA, 1 USD = 4600 MGA)
const EXCHANGE_RATES = {
  'EUR': 5100,
  'USD': 4600,
  'GBP': 5800,
  'CNY': 640
}

// Fonction pour calculer les coûts d'importation
function calculateImportCosts(supplierPrice, currency, weight, mode, warehouse) {
  const supplierPriceInMGA = supplierPrice * EXCHANGE_RATES[currency]
  
  // Coûts de transport (approximatifs)
  let transportCostPerKg
  if (mode === 'air') {
    transportCostPerKg = warehouse === 'usa' ? 15000 : 
                        warehouse === 'france' ? 12000 : 
                        warehouse === 'uk' ? 13000 : 12000
  } else { // sea
    transportCostPerKg = warehouse === 'france' ? 3000 : 
                        warehouse === 'china' ? 2500 : 3000
  }
  
  const transportCost = weight * transportCostPerKg
  
  // Commission (15% du prix fournisseur)
  const commissionRate = 0.15
  const commission = supplierPriceInMGA * commissionRate
  
  // Frais de traitement (fixe)
  const processingFees = 50000 // 50 000 MGA
  
  // Taxes (20% du prix fournisseur + transport)
  const taxRate = 0.20
  const taxableAmount = supplierPriceInMGA + transportCost
  const tax = taxableAmount * taxRate
  
  const total = supplierPriceInMGA + transportCost + commission + processingFees + tax
  
  return {
    supplierPrice: {
      amount: supplierPrice,
      currency: currency,
      amountInMGA: supplierPriceInMGA
    },
    transport: {
      amount: transportCost / EXCHANGE_RATES[currency],
      currency: currency,
      amountInMGA: transportCost,
      details: `Transport ${mode === 'air' ? 'aérien' : 'maritime'} depuis ${warehouse}`
    },
    commission: {
      amount: commission / EXCHANGE_RATES[currency],
      currency: currency,
      amountInMGA: commission,
      rate: commissionRate,
      details: `Commission de ${(commissionRate * 100)}%`
    },
    fees: {
      processing: {
        amount: processingFees / EXCHANGE_RATES[currency],
        currency: currency,
        amountInMGA: processingFees
      },
      tax: {
        amount: tax / EXCHANGE_RATES[currency],
        currency: currency,
        amountInMGA: tax,
        rate: taxRate
      }
    },
    total: Math.round(total / 100) * 100 // Arrondir à 100 MGA près
  }
}

// Fonction pour créer un produit via l'API du simulateur
async function createProductFromSimulation(productData) {
  const costs = calculateImportCosts(
    productData.supplierPrice,
    productData.currency,
    productData.weight,
    productData.mode,
    productData.warehouse
  )
  
  const simulationData = {
    productInfo: {
      name: productData.name,
      url: productData.url || '',
      specifications: productData.specifications || '',
      weight: productData.weight,
      volume: productData.volume,
      mode: productData.mode,
      warehouse: productData.warehouse
    },
    costs: costs,
    calculationMethod: `Calcul automatique - Transport ${productData.mode}`,
    transitTime: productData.mode === 'air' ? '7-14 jours' : '30-45 jours'
  }
  
  try {
    // Simuler l'appel API (en réalité, on utilise directement Prisma)
    const sku = generateSKU(productData.name)
    const slug = generateSlug(productData.name)
    
    // Vérifier l'unicité
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: sku },
          { slug: slug }
        ]
      }
    })
    
    if (existing) {
      console.log(`⚠️ Produit existant: ${productData.name}`)
      return null
    }
    
    // Trouver ou créer la catégorie "Produits importés"
    let category = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: 'Produits importés',
          slug: 'produits-importes',
          description: 'Produits importés depuis l\'étranger'
        }
      })
    }
    
    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: slug,
        description: `Produit importé via ${productData.mode === 'air' ? 'transport aérien' : 'transport maritime'} depuis ${getWarehouseName(productData.warehouse)}.\n\n${productData.specifications ? `Spécifications:\n${productData.specifications}\n\n` : ''}Coût d'importation calculé: ${costs.total.toLocaleString('fr-FR')} Ar\nDélai de livraison: ${simulationData.transitTime}`,
        price: costs.total,
        sku: sku,
        inventory: 0,
        weight: productData.weight,
        published: false, // Créé en brouillon par défaut
        featured: false,
        categoryId: category.id,
        attributes: {
          create: [
            {
              name: 'supplierPrice',
              value: costs.supplierPrice.amount.toString()
            },
            {
              name: 'supplierCurrency',
              value: costs.supplierPrice.currency
            },
            {
              name: 'warehouse',
              value: productData.warehouse
            },
            {
              name: 'transportMode',
              value: productData.mode
            },
            {
              name: 'weight',
              value: productData.weight.toString()
            },
            {
              name: 'importCost',
              value: costs.total.toString()
            },
            {
              name: 'transitTime',
              value: simulationData.transitTime
            },
            {
              name: 'transportCost',
              value: costs.transport.amountInMGA.toString()
            },
            {
              name: 'commissionRate',
              value: costs.commission.rate.toString()
            },
            {
              name: 'commissionAmount',
              value: costs.commission.amountInMGA.toString()
            },
            {
              name: 'processingFees',
              value: costs.fees.processing.amountInMGA.toString()
            },
            {
              name: 'taxRate',
              value: costs.fees.tax.rate.toString()
            },
            {
              name: 'taxAmount',
              value: costs.fees.tax.amountInMGA.toString()
            },
            {
              name: 'calculationMethod',
              value: simulationData.calculationMethod
            },
            ...(productData.url ? [{
              name: 'productUrl',
              value: productData.url
            }] : []),
            ...(productData.specifications ? [{
              name: 'specifications',
              value: productData.specifications
            }] : []),
            ...(productData.volume ? [{
              name: 'volume',
              value: productData.volume.toString()
            }] : [])
          ]
        }
      },
      include: {
        attributes: true,
        category: true
      }
    })
    
    return product
    
  } catch (error) {
    console.error(`❌ Erreur lors de la création de ${productData.name}:`, error)
    return null
  }
}

// Fonctions utilitaires
function generateSKU(name) {
  const cleanName = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .map(word => word.substring(0, 3).toUpperCase())
    .join('')
    .substring(0, 8)
  
  const timestamp = Date.now().toString().slice(-4)
  return `${cleanName}${timestamp}`
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function getWarehouseName(warehouse) {
  const warehouses = {
    'usa': 'États-Unis',
    'france': 'France',
    'uk': 'Royaume-Uni',
    'china': 'Chine'
  }
  return warehouses[warehouse] || warehouse
}

async function main() {
  console.log('🚢 Création de produits importés via le simulateur...')
  
  // Produits à importer (exemples réalistes)
  const productsToImport = [
    // Transport aérien depuis les USA
    {
      name: 'iPhone 15 Pro 128GB',
      supplierPrice: 999,
      currency: 'USD',
      weight: 0.5,
      mode: 'air',
      warehouse: 'usa',
      specifications: 'iPhone 15 Pro 128GB - Titanium Blue\nÉcran 6.1" Super Retina XDR\nPuce A17 Pro\nTriple caméra 48MP',
      url: 'https://www.apple.com/iphone-15-pro/'
    },
    {
      name: 'MacBook Air M3 13"',
      supplierPrice: 1299,
      currency: 'USD',
      weight: 1.3,
      mode: 'air',
      warehouse: 'usa',
      specifications: 'MacBook Air 13" avec puce M3\n8GB RAM, 256GB SSD\nÉcran Liquid Retina 13.6"\nAutonomie jusqu\'à 18h',
      url: 'https://www.apple.com/macbook-air-13-and-15-m3/'
    },
    {
      name: 'AirPods Pro 2ème génération',
      supplierPrice: 249,
      currency: 'USD',
      weight: 0.3,
      mode: 'air',
      warehouse: 'usa',
      specifications: 'AirPods Pro avec puce H2\nRéduction de bruit active\nAudio spatial personnalisé\nBoîtier de charge MagSafe',
      url: 'https://www.apple.com/airpods-pro/'
    },
    
    // Transport aérien depuis la France
    {
      name: 'Parfum Dior Sauvage 100ml',
      supplierPrice: 89,
      currency: 'EUR',
      weight: 0.4,
      mode: 'air',
      warehouse: 'france',
      specifications: 'Dior Sauvage Eau de Toilette 100ml\nNotes de bergamote, poivre et ambroxan\nFlacon rechargeable',
      url: 'https://www.dior.com/fr_fr/products/beauty-Y0685240'
    },
    {
      name: 'Sac Louis Vuitton Neverfull MM',
      supplierPrice: 1450,
      currency: 'EUR',
      weight: 0.8,
      mode: 'air',
      warehouse: 'france',
      specifications: 'Sac Louis Vuitton Neverfull MM\nToile Monogram\nIntérieur en textile\nDimensions: 32 x 29 x 17 cm',
      url: 'https://fr.louisvuitton.com/fra-fr/produits/neverfull-mm-monogram-000634'
    },
    
    // Transport aérien depuis le UK
    {
      name: 'Montre Rolex Submariner Date',
      supplierPrice: 8950,
      currency: 'GBP',
      weight: 0.2,
      mode: 'air',
      warehouse: 'uk',
      specifications: 'Rolex Submariner Date 41mm\nAcier Oystersteel\nCadran noir\nBracelet Oyster\nÉtanche 300m',
      url: 'https://www.rolex.com/watches/submariner/m126610ln-0001.html'
    },
    
    // Transport maritime depuis la Chine
    {
      name: 'Vélo électrique Xiaomi Mi Smart',
      supplierPrice: 599,
      currency: 'USD',
      weight: 22.5,
      volume: 0.8,
      mode: 'sea',
      warehouse: 'china',
      specifications: 'Vélo électrique Xiaomi Mi Smart\nAutonomie 45km\nVitesse max 25km/h\nBatterie 36V 10.4Ah\nPoids 22.5kg',
      url: 'https://www.mi.com/global/mi-smart-electric-folding-bike'
    },
    {
      name: 'Trottinette électrique Ninebot Max G30',
      supplierPrice: 449,
      currency: 'USD',
      weight: 18.7,
      volume: 0.6,
      mode: 'sea',
      warehouse: 'china',
      specifications: 'Ninebot KickScooter Max G30\nAutonomie 65km\nVitesse max 30km/h\nPneus 10" tubeless\nPliable et portable',
      url: 'https://www.segway.com/ninebot-kickscooter-max-g30/'
    },
    {
      name: 'Drone DJI Mini 3',
      supplierPrice: 759,
      currency: 'USD',
      weight: 2.4,
      mode: 'air',
      warehouse: 'china',
      specifications: 'DJI Mini 3 Drone\nCaméra 4K/30fps\nAutonomie 38 min\nTransmission 10km\nPoids 249g\nGimbal 3 axes',
      url: 'https://www.dji.com/mini-3'
    },
    
    // Transport maritime depuis la France
    {
      name: 'Machine à café Delonghi Magnifica S',
      supplierPrice: 399,
      currency: 'EUR',
      weight: 9.5,
      volume: 0.12,
      mode: 'sea',
      warehouse: 'france',
      specifications: 'Machine à café automatique Delonghi\nBroyeur intégré\nCappuccinatore manuel\nRéservoir 1.8L\n15 bars de pression',
      url: 'https://www.delonghi.com/fr-fr/magnifica-s-ecam-22110b-machine-cafe-automatique/p/ECAM22.110.B'
    }
  ]
  
  let created = 0
  let skipped = 0
  
  for (const productData of productsToImport) {
    console.log(`\n📦 Traitement: ${productData.name}`)
    console.log(`   Prix fournisseur: ${productData.supplierPrice} ${productData.currency}`)
    console.log(`   Transport: ${productData.mode === 'air' ? 'Aérien' : 'Maritime'} depuis ${getWarehouseName(productData.warehouse)}`)
    console.log(`   Poids: ${productData.weight}kg${productData.volume ? `, Volume: ${productData.volume}m³` : ''}`)
    
    const product = await createProductFromSimulation(productData)
    
    if (product) {
      const costs = calculateImportCosts(
        productData.supplierPrice,
        productData.currency,
        productData.weight,
        productData.mode,
        productData.warehouse
      )
      
      console.log(`   ✅ Créé avec succès!`)
      console.log(`   💰 Prix final: ${costs.total.toLocaleString('fr-FR')} MGA`)
      console.log(`   🏷️ SKU: ${product.sku}`)
      created++
    } else {
      console.log(`   ⚠️ Ignoré (déjà existant)`)
      skipped++
    }
    
    // Petite pause pour éviter de surcharger la base
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n🎉 Terminé!`)
  console.log(`✅ ${created} produits créés`)
  console.log(`⚠️ ${skipped} produits ignorés (déjà existants)`)
  console.log(`\n💡 Les produits sont créés en brouillon. Vous pouvez les publier depuis l'administration.`)
  console.log(`🔗 Voir les produits: http://localhost:3000/admin/products`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 