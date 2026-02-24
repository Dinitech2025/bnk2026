const { PrismaClient } = require('@prisma/client')

async function testPrismaConnection() {
  console.log('🔍 Test de la connexion Prisma...')
  console.log('=' .repeat(50))

  let prisma
  
  try {
    // Créer une nouvelle instance Prisma
    prisma = new PrismaClient()
    console.log('✅ Instance Prisma créée')

    // Tester la connexion
    await prisma.$connect()
    console.log('✅ Connexion à la base de données établie')

    // Tester une requête simple
    const productCount = await prisma.product.count()
    console.log(`✅ Requête test réussie - ${productCount} produits dans la base`)

    // Tester la table ProductCategory
    const categoryCount = await prisma.productCategory.count()
    console.log(`✅ Table ProductCategory accessible - ${categoryCount} catégories`)

    // Vérifier la catégorie "Produits importés"
    const importedCategory = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (importedCategory) {
      console.log(`✅ Catégorie "Produits importés" trouvée (ID: ${importedCategory.id})`)
    } else {
      console.log('⚠️ Catégorie "Produits importés" non trouvée - sera créée automatiquement')
    }

    // Tester les tables liées
    const attributeCount = await prisma.productAttribute.count()
    console.log(`✅ Table ProductAttribute accessible - ${attributeCount} attributs`)

    // Tester la table Media
    const mediaCount = await prisma.media.count()
    console.log(`✅ Table Media accessible - ${mediaCount} médias`)

    console.log('\n🎉 Tous les tests Prisma sont passés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test Prisma:', error)
    console.error('Type d\'erreur:', error.constructor.name)
    console.error('Message:', error.message)
    
    if (error.code) {
      console.error('Code d\'erreur:', error.code)
    }
    
    // Suggestions de résolution
    console.log('\n🔧 Suggestions de résolution:')
    console.log('1. Vérifiez que la base de données est démarrée')
    console.log('2. Vérifiez la variable DATABASE_URL dans .env')
    console.log('3. Exécutez: npx prisma generate')
    console.log('4. Exécutez: npx prisma db push')
    
  } finally {
    if (prisma) {
      await prisma.$disconnect()
      console.log('🔌 Connexion Prisma fermée')
    }
  }
}

// Test spécifique pour l'API de création de produit
async function testProductCreationAPI() {
  console.log('\n🧪 Test de l\'API de création de produit...')
  console.log('=' .repeat(50))

  const testData = {
    productInfo: {
      name: 'Test Product',
      url: 'https://example.com',
      specifications: 'Test specifications',
      weight: 1,
      mode: 'air',
      warehouse: 'États-Unis'
    },
    costs: {
      supplierPrice: {
        amount: 50,
        currency: 'USD',
        amountInMGA: 255000
      },
      transport: {
        amount: 35,
        currency: 'USD',
        amountInMGA: 178500,
        details: '1 kg × 35 USD/kg'
      },
      commission: {
        amount: 19.25,
        currency: 'USD',
        amountInMGA: 98175,
        rate: 38.5,
        details: '38.5% du prix fournisseur'
      },
      fees: {
        processing: {
          amount: 2,
          currency: 'USD',
          amountInMGA: 10200
        },
        tax: {
          amount: 1.75,
          currency: 'USD',
          amountInMGA: 8925,
          rate: 3.5
        }
      },
      total: 550800
    },
    calculationMethod: 'hybrid',
    transitTime: '5-10 jours'
  }

  try {
    const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: En production, il faudrait une vraie session
      },
      body: JSON.stringify(testData)
    })

    console.log('Status de la réponse:', response.status)
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API de création réussie')
      console.log('Produit créé:', result.product?.name)
      console.log('SKU:', result.product?.sku)
    } else {
      console.log('❌ Erreur API:', result.error)
    }
    
  } catch (error) {
    console.log('❌ Erreur de connexion API:', error.message)
    console.log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
  }
}

// Exécuter les tests
async function runAllTests() {
  await testPrismaConnection()
  
  console.log('\n' + '='.repeat(70))
  
  // Note: Le test API nécessite une session valide
  console.log('\n💡 Pour tester l\'API complètement:')
  console.log('1. Connectez-vous dans le navigateur')
  console.log('2. Utilisez le simulateur d\'importation')
  console.log('3. Essayez de créer un produit')
}

runAllTests().catch(console.error) 

async function testPrismaConnection() {
  console.log('🔍 Test de la connexion Prisma...')
  console.log('=' .repeat(50))

  let prisma
  
  try {
    // Créer une nouvelle instance Prisma
    prisma = new PrismaClient()
    console.log('✅ Instance Prisma créée')

    // Tester la connexion
    await prisma.$connect()
    console.log('✅ Connexion à la base de données établie')

    // Tester une requête simple
    const productCount = await prisma.product.count()
    console.log(`✅ Requête test réussie - ${productCount} produits dans la base`)

    // Tester la table ProductCategory
    const categoryCount = await prisma.productCategory.count()
    console.log(`✅ Table ProductCategory accessible - ${categoryCount} catégories`)

    // Vérifier la catégorie "Produits importés"
    const importedCategory = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (importedCategory) {
      console.log(`✅ Catégorie "Produits importés" trouvée (ID: ${importedCategory.id})`)
    } else {
      console.log('⚠️ Catégorie "Produits importés" non trouvée - sera créée automatiquement')
    }

    // Tester les tables liées
    const attributeCount = await prisma.productAttribute.count()
    console.log(`✅ Table ProductAttribute accessible - ${attributeCount} attributs`)

    // Tester la table Media
    const mediaCount = await prisma.media.count()
    console.log(`✅ Table Media accessible - ${mediaCount} médias`)

    console.log('\n🎉 Tous les tests Prisma sont passés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test Prisma:', error)
    console.error('Type d\'erreur:', error.constructor.name)
    console.error('Message:', error.message)
    
    if (error.code) {
      console.error('Code d\'erreur:', error.code)
    }
    
    // Suggestions de résolution
    console.log('\n🔧 Suggestions de résolution:')
    console.log('1. Vérifiez que la base de données est démarrée')
    console.log('2. Vérifiez la variable DATABASE_URL dans .env')
    console.log('3. Exécutez: npx prisma generate')
    console.log('4. Exécutez: npx prisma db push')
    
  } finally {
    if (prisma) {
      await prisma.$disconnect()
      console.log('🔌 Connexion Prisma fermée')
    }
  }
}

// Test spécifique pour l'API de création de produit
async function testProductCreationAPI() {
  console.log('\n🧪 Test de l\'API de création de produit...')
  console.log('=' .repeat(50))

  const testData = {
    productInfo: {
      name: 'Test Product',
      url: 'https://example.com',
      specifications: 'Test specifications',
      weight: 1,
      mode: 'air',
      warehouse: 'États-Unis'
    },
    costs: {
      supplierPrice: {
        amount: 50,
        currency: 'USD',
        amountInMGA: 255000
      },
      transport: {
        amount: 35,
        currency: 'USD',
        amountInMGA: 178500,
        details: '1 kg × 35 USD/kg'
      },
      commission: {
        amount: 19.25,
        currency: 'USD',
        amountInMGA: 98175,
        rate: 38.5,
        details: '38.5% du prix fournisseur'
      },
      fees: {
        processing: {
          amount: 2,
          currency: 'USD',
          amountInMGA: 10200
        },
        tax: {
          amount: 1.75,
          currency: 'USD',
          amountInMGA: 8925,
          rate: 3.5
        }
      },
      total: 550800
    },
    calculationMethod: 'hybrid',
    transitTime: '5-10 jours'
  }

  try {
    const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: En production, il faudrait une vraie session
      },
      body: JSON.stringify(testData)
    })

    console.log('Status de la réponse:', response.status)
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API de création réussie')
      console.log('Produit créé:', result.product?.name)
      console.log('SKU:', result.product?.sku)
    } else {
      console.log('❌ Erreur API:', result.error)
    }
    
  } catch (error) {
    console.log('❌ Erreur de connexion API:', error.message)
    console.log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
  }
}

// Exécuter les tests
async function runAllTests() {
  await testPrismaConnection()
  
  console.log('\n' + '='.repeat(70))
  
  // Note: Le test API nécessite une session valide
  console.log('\n💡 Pour tester l\'API complètement:')
  console.log('1. Connectez-vous dans le navigateur')
  console.log('2. Utilisez le simulateur d\'importation')
  console.log('3. Essayez de créer un produit')
}

runAllTests().catch(console.error) 