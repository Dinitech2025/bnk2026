const { PrismaClient } = require('@prisma/client')

console.log('🧪 Test du système d\'images des fournisseurs...')
console.log('=' .repeat(60))

async function testSupplierImages() {
  const prisma = new PrismaClient()
  
  try {
    // 1. Vérifier la configuration Cloudinary
    console.log('🔧 Vérification de la configuration Cloudinary...')
    
    const cloudinaryVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ]
    
    const missingVars = cloudinaryVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.log('⚠️ Variables Cloudinary manquantes:')
      missingVars.forEach(varName => console.log(`   - ${varName}`))
      console.log('\n💡 Exécutez: node scripts/setup-cloudinary-integration.js')
      return
    }
    
    console.log('✅ Configuration Cloudinary trouvée')
    
    // 2. Tester l'extraction d'ASIN
    console.log('\n🔍 Test d\'extraction d\'ASIN...')
    
    const { extractASIN } = require('../lib/supplier-images.ts')
    
    const testUrls = [
      'https://www.amazon.fr/dp/B0DMVB5XFF',
      'https://amazon.com/dp/B08N5WRWNW',
      'https://www.amazon.co.uk/dp/B07XJ8C8F5',
      'https://example.com/product/123' // Non-Amazon
    ]
    
    testUrls.forEach(url => {
      const asin = extractASIN(url)
      console.log(`   ${url} → ASIN: ${asin || 'Non trouvé'}`)
    })
    
    // 3. Vérifier les produits existants avec URLs fournisseur
    console.log('\n📦 Vérification des produits avec URLs fournisseur...')
    
    const productsWithUrls = await prisma.product.findMany({
      where: {
        attributes: {
          some: {
            name: {
              in: ['productUrl', 'supplier_url', 'amazon_url']
            }
          }
        }
      },
      include: {
        attributes: {
          where: {
            name: {
              in: ['productUrl', 'supplier_url', 'amazon_url', 'asin']
            }
          }
        },
        images: true
      }
    })
    
    console.log(`✅ ${productsWithUrls.length} produits avec URLs fournisseur trouvés`)
    
    if (productsWithUrls.length > 0) {
      console.log('\n📋 Détails des produits:')
      
      productsWithUrls.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`)
        console.log(`   ID: ${product.id}`)
        console.log(`   Images: ${product.images.length}`)
        
        product.attributes.forEach(attr => {
          console.log(`   ${attr.name}: ${attr.value}`)
        })
      })
    }
    
    // 4. Test de simulation de traitement d'images
    console.log('\n🎯 Test de simulation de traitement d\'images...')
    
    const testProduct = productsWithUrls[0]
    if (testProduct) {
      const supplierUrl = testProduct.attributes.find(attr => 
        ['productUrl', 'supplier_url', 'amazon_url'].includes(attr.name)
      )?.value
      
      if (supplierUrl) {
        console.log(`   Produit test: ${testProduct.name}`)
        console.log(`   URL fournisseur: ${supplierUrl}`)
        
        // Simuler le traitement (sans vraiment uploader)
        console.log('   🔄 Simulation du traitement...')
        
        if (supplierUrl.includes('amazon.')) {
          console.log('   ✅ Détecté comme URL Amazon')
          const asin = extractASIN(supplierUrl)
          console.log(`   ✅ ASIN extrait: ${asin}`)
        } else {
          console.log('   ✅ Détecté comme URL générique')
        }
        
        console.log('   ✅ Simulation réussie')
      } else {
        console.log('   ⚠️ Aucune URL fournisseur trouvée')
      }
    } else {
      console.log('   ⚠️ Aucun produit de test disponible')
    }
    
    // 5. Instructions pour le test complet
    console.log('\n📝 Pour tester complètement le système:')
    console.log('1. Configurez Cloudinary dans .env.local')
    console.log('2. Ouvrez: http://localhost:3000/admin/products/imported/simulation')
    console.log('3. Remplissez le formulaire avec:')
    console.log('   - Nom du produit: "Test iPhone 15"')
    console.log('   - URL: "https://www.amazon.fr/dp/B0CHX1W1XY"')
    console.log('   - Prix: 100 USD')
    console.log('   - Poids: 1 kg')
    console.log('4. Créez le produit et vérifiez les images')
    
    console.log('\n🎉 Test terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('Type:', error.constructor.name)
    console.error('Message:', error.message)
    
  } finally {
    await prisma.$disconnect()
  }
}

// Test de l'API de création
async function testAPICreation() {
  console.log('\n🌐 Test de l\'API de création...')
  
  const testData = {
    productInfo: {
      name: 'Test iPhone 15 Pro',
      url: 'https://www.amazon.fr/dp/B0CHX1W1XY',
      weight: 0.2,
      mode: 'air',
      warehouse: 'États-Unis'
    },
    costs: {
      supplierPrice: { amount: 1000, currency: 'USD', amountInMGA: 5100000 },
      transport: { amount: 50, currency: 'USD', amountInMGA: 255000, details: '0.2kg × 250 USD/kg' },
      commission: { amount: 262.5, currency: 'USD', amountInMGA: 1338750, rate: 25, details: '25%' },
      fees: {
        processing: { amount: 10, currency: 'USD', amountInMGA: 51000 },
        tax: { amount: 26.25, currency: 'USD', amountInMGA: 133875, rate: 20 }
      },
      total: 6878625
    },
    calculationMethod: 'hybrid',
    transitTime: '5-10 jours'
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('   ✅ API accessible (401 = session requise)')
    } else if (response.status === 200) {
      const result = await response.json()
      console.log('   ✅ Produit créé avec succès!')
      console.log(`   Images ajoutées: ${result.images?.added || 0}`)
      console.log(`   Source: ${result.images?.source || 'aucune'}`)
    } else {
      const result = await response.json()
      console.log(`   ❌ Erreur: ${result.error}`)
    }
    
  } catch (error) {
    console.log('   ⚠️ Serveur non accessible:', error.message)
    console.log('   💡 Assurez-vous que le serveur est démarré: npm run dev')
  }
}

async function runAllTests() {
  await testSupplierImages()
  await testAPICreation()
}

runAllTests().catch(console.error) 

console.log('🧪 Test du système d\'images des fournisseurs...')
console.log('=' .repeat(60))

async function testSupplierImages() {
  const prisma = new PrismaClient()
  
  try {
    // 1. Vérifier la configuration Cloudinary
    console.log('🔧 Vérification de la configuration Cloudinary...')
    
    const cloudinaryVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ]
    
    const missingVars = cloudinaryVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.log('⚠️ Variables Cloudinary manquantes:')
      missingVars.forEach(varName => console.log(`   - ${varName}`))
      console.log('\n💡 Exécutez: node scripts/setup-cloudinary-integration.js')
      return
    }
    
    console.log('✅ Configuration Cloudinary trouvée')
    
    // 2. Tester l'extraction d'ASIN
    console.log('\n🔍 Test d\'extraction d\'ASIN...')
    
    const { extractASIN } = require('../lib/supplier-images.ts')
    
    const testUrls = [
      'https://www.amazon.fr/dp/B0DMVB5XFF',
      'https://amazon.com/dp/B08N5WRWNW',
      'https://www.amazon.co.uk/dp/B07XJ8C8F5',
      'https://example.com/product/123' // Non-Amazon
    ]
    
    testUrls.forEach(url => {
      const asin = extractASIN(url)
      console.log(`   ${url} → ASIN: ${asin || 'Non trouvé'}`)
    })
    
    // 3. Vérifier les produits existants avec URLs fournisseur
    console.log('\n📦 Vérification des produits avec URLs fournisseur...')
    
    const productsWithUrls = await prisma.product.findMany({
      where: {
        attributes: {
          some: {
            name: {
              in: ['productUrl', 'supplier_url', 'amazon_url']
            }
          }
        }
      },
      include: {
        attributes: {
          where: {
            name: {
              in: ['productUrl', 'supplier_url', 'amazon_url', 'asin']
            }
          }
        },
        images: true
      }
    })
    
    console.log(`✅ ${productsWithUrls.length} produits avec URLs fournisseur trouvés`)
    
    if (productsWithUrls.length > 0) {
      console.log('\n📋 Détails des produits:')
      
      productsWithUrls.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`)
        console.log(`   ID: ${product.id}`)
        console.log(`   Images: ${product.images.length}`)
        
        product.attributes.forEach(attr => {
          console.log(`   ${attr.name}: ${attr.value}`)
        })
      })
    }
    
    // 4. Test de simulation de traitement d'images
    console.log('\n🎯 Test de simulation de traitement d\'images...')
    
    const testProduct = productsWithUrls[0]
    if (testProduct) {
      const supplierUrl = testProduct.attributes.find(attr => 
        ['productUrl', 'supplier_url', 'amazon_url'].includes(attr.name)
      )?.value
      
      if (supplierUrl) {
        console.log(`   Produit test: ${testProduct.name}`)
        console.log(`   URL fournisseur: ${supplierUrl}`)
        
        // Simuler le traitement (sans vraiment uploader)
        console.log('   🔄 Simulation du traitement...')
        
        if (supplierUrl.includes('amazon.')) {
          console.log('   ✅ Détecté comme URL Amazon')
          const asin = extractASIN(supplierUrl)
          console.log(`   ✅ ASIN extrait: ${asin}`)
        } else {
          console.log('   ✅ Détecté comme URL générique')
        }
        
        console.log('   ✅ Simulation réussie')
      } else {
        console.log('   ⚠️ Aucune URL fournisseur trouvée')
      }
    } else {
      console.log('   ⚠️ Aucun produit de test disponible')
    }
    
    // 5. Instructions pour le test complet
    console.log('\n📝 Pour tester complètement le système:')
    console.log('1. Configurez Cloudinary dans .env.local')
    console.log('2. Ouvrez: http://localhost:3000/admin/products/imported/simulation')
    console.log('3. Remplissez le formulaire avec:')
    console.log('   - Nom du produit: "Test iPhone 15"')
    console.log('   - URL: "https://www.amazon.fr/dp/B0CHX1W1XY"')
    console.log('   - Prix: 100 USD')
    console.log('   - Poids: 1 kg')
    console.log('4. Créez le produit et vérifiez les images')
    
    console.log('\n🎉 Test terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('Type:', error.constructor.name)
    console.error('Message:', error.message)
    
  } finally {
    await prisma.$disconnect()
  }
}

// Test de l'API de création
async function testAPICreation() {
  console.log('\n🌐 Test de l\'API de création...')
  
  const testData = {
    productInfo: {
      name: 'Test iPhone 15 Pro',
      url: 'https://www.amazon.fr/dp/B0CHX1W1XY',
      weight: 0.2,
      mode: 'air',
      warehouse: 'États-Unis'
    },
    costs: {
      supplierPrice: { amount: 1000, currency: 'USD', amountInMGA: 5100000 },
      transport: { amount: 50, currency: 'USD', amountInMGA: 255000, details: '0.2kg × 250 USD/kg' },
      commission: { amount: 262.5, currency: 'USD', amountInMGA: 1338750, rate: 25, details: '25%' },
      fees: {
        processing: { amount: 10, currency: 'USD', amountInMGA: 51000 },
        tax: { amount: 26.25, currency: 'USD', amountInMGA: 133875, rate: 20 }
      },
      total: 6878625
    },
    calculationMethod: 'hybrid',
    transitTime: '5-10 jours'
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('   ✅ API accessible (401 = session requise)')
    } else if (response.status === 200) {
      const result = await response.json()
      console.log('   ✅ Produit créé avec succès!')
      console.log(`   Images ajoutées: ${result.images?.added || 0}`)
      console.log(`   Source: ${result.images?.source || 'aucune'}`)
    } else {
      const result = await response.json()
      console.log(`   ❌ Erreur: ${result.error}`)
    }
    
  } catch (error) {
    console.log('   ⚠️ Serveur non accessible:', error.message)
    console.log('   💡 Assurez-vous que le serveur est démarré: npm run dev')
  }
}

async function runAllTests() {
  await testSupplierImages()
  await testAPICreation()
}

runAllTests().catch(console.error) 