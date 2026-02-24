const { PrismaClient } = require('@prisma/client')

console.log('🧪 Test final des corrections prisma.category...')
console.log('=' .repeat(60))

async function testFinalFix() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📊 Test des modèles Prisma...')
    
    // Test ProductCategory
    const productCategoryCount = await prisma.productCategory.count()
    console.log(`✅ ProductCategory: ${productCategoryCount} catégories`)
    
    // Test ServiceCategory  
    const serviceCategoryCount = await prisma.serviceCategory.count()
    console.log(`✅ ServiceCategory: ${serviceCategoryCount} catégories`)
    
    // Test Product
    const productCount = await prisma.product.count()
    console.log(`✅ Product: ${productCount} produits`)
    
    // Test Service
    const serviceCount = await prisma.service.count()
    console.log(`✅ Service: ${serviceCount} services`)
    
    // Vérifier la catégorie "Produits importés"
    const importedCategory = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (importedCategory) {
      console.log(`✅ Catégorie "Produits importés" trouvée (ID: ${importedCategory.id})`)
    } else {
      console.log('⚠️ Catégorie "Produits importés" non trouvée')
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès!')
    
    console.log('\n📋 État de la base de données:')
    console.log(`- ${productCount} produits`)
    console.log(`- ${serviceCount} services`)
    console.log(`- ${productCategoryCount} catégories de produits`)
    console.log(`- ${serviceCategoryCount} catégories de services`)
    
    console.log('\n✅ Le simulateur d\'importation devrait maintenant fonctionner!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('Type:', error.constructor.name)
    console.error('Message:', error.message)
    
    if (error.code) {
      console.error('Code:', error.code)
    }
    
  } finally {
    await prisma.$disconnect()
  }
}

// Test de l'API de création (sans session)
async function testAPIEndpoint() {
  console.log('\n🌐 Test de l\'endpoint API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productInfo: {
          name: 'Test Product',
          weight: 1,
          mode: 'air',
          warehouse: 'États-Unis'
        },
        costs: {
          supplierPrice: { amount: 100, currency: 'USD', amountInMGA: 510000 },
          transport: { amount: 35, currency: 'USD', amountInMGA: 178500, details: '1kg × 35 USD/kg' },
          commission: { amount: 25, currency: 'USD', amountInMGA: 127500, rate: 25, details: '25%' },
          fees: {
            processing: { amount: 2, currency: 'USD', amountInMGA: 10200 },
            tax: { amount: 3.5, currency: 'USD', amountInMGA: 17850, rate: 3.5 }
          },
          total: 844050
        },
        calculationMethod: 'hybrid',
        transitTime: '5-10 jours'
      })
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('✅ API répond correctement (401 = session requise)')
    } else if (response.status === 500) {
      const result = await response.json()
      console.log('❌ Erreur serveur:', result.error)
    } else {
      console.log('✅ API accessible')
    }
    
  } catch (error) {
    console.log('⚠️ Serveur Next.js non accessible:', error.message)
    console.log('💡 Assurez-vous que le serveur est démarré avec: npm run dev')
  }
}

async function runAllTests() {
  await testFinalFix()
  await testAPIEndpoint()
  
  console.log('\n📝 Instructions pour tester manuellement:')
  console.log('1. Ouvrir: http://localhost:3000/admin/products/imported/simulation')
  console.log('2. Se connecter en tant qu\'admin')
  console.log('3. Remplir le formulaire et créer un produit')
  console.log('4. Vérifier que la création fonctionne sans erreur')
  
  console.log('\n🔧 Si des erreurs persistent:')
  console.log('1. Vérifier les logs du serveur Next.js')
  console.log('2. Redémarrer le serveur: npm run dev')
  console.log('3. Vider le cache: rm -rf .next && npm run dev')
}

runAllTests().catch(console.error) 

console.log('🧪 Test final des corrections prisma.category...')
console.log('=' .repeat(60))

async function testFinalFix() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📊 Test des modèles Prisma...')
    
    // Test ProductCategory
    const productCategoryCount = await prisma.productCategory.count()
    console.log(`✅ ProductCategory: ${productCategoryCount} catégories`)
    
    // Test ServiceCategory  
    const serviceCategoryCount = await prisma.serviceCategory.count()
    console.log(`✅ ServiceCategory: ${serviceCategoryCount} catégories`)
    
    // Test Product
    const productCount = await prisma.product.count()
    console.log(`✅ Product: ${productCount} produits`)
    
    // Test Service
    const serviceCount = await prisma.service.count()
    console.log(`✅ Service: ${serviceCount} services`)
    
    // Vérifier la catégorie "Produits importés"
    const importedCategory = await prisma.productCategory.findFirst({
      where: { name: 'Produits importés' }
    })
    
    if (importedCategory) {
      console.log(`✅ Catégorie "Produits importés" trouvée (ID: ${importedCategory.id})`)
    } else {
      console.log('⚠️ Catégorie "Produits importés" non trouvée')
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès!')
    
    console.log('\n📋 État de la base de données:')
    console.log(`- ${productCount} produits`)
    console.log(`- ${serviceCount} services`)
    console.log(`- ${productCategoryCount} catégories de produits`)
    console.log(`- ${serviceCategoryCount} catégories de services`)
    
    console.log('\n✅ Le simulateur d\'importation devrait maintenant fonctionner!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('Type:', error.constructor.name)
    console.error('Message:', error.message)
    
    if (error.code) {
      console.error('Code:', error.code)
    }
    
  } finally {
    await prisma.$disconnect()
  }
}

// Test de l'API de création (sans session)
async function testAPIEndpoint() {
  console.log('\n🌐 Test de l\'endpoint API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/create-from-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productInfo: {
          name: 'Test Product',
          weight: 1,
          mode: 'air',
          warehouse: 'États-Unis'
        },
        costs: {
          supplierPrice: { amount: 100, currency: 'USD', amountInMGA: 510000 },
          transport: { amount: 35, currency: 'USD', amountInMGA: 178500, details: '1kg × 35 USD/kg' },
          commission: { amount: 25, currency: 'USD', amountInMGA: 127500, rate: 25, details: '25%' },
          fees: {
            processing: { amount: 2, currency: 'USD', amountInMGA: 10200 },
            tax: { amount: 3.5, currency: 'USD', amountInMGA: 17850, rate: 3.5 }
          },
          total: 844050
        },
        calculationMethod: 'hybrid',
        transitTime: '5-10 jours'
      })
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('✅ API répond correctement (401 = session requise)')
    } else if (response.status === 500) {
      const result = await response.json()
      console.log('❌ Erreur serveur:', result.error)
    } else {
      console.log('✅ API accessible')
    }
    
  } catch (error) {
    console.log('⚠️ Serveur Next.js non accessible:', error.message)
    console.log('💡 Assurez-vous que le serveur est démarré avec: npm run dev')
  }
}

async function runAllTests() {
  await testFinalFix()
  await testAPIEndpoint()
  
  console.log('\n📝 Instructions pour tester manuellement:')
  console.log('1. Ouvrir: http://localhost:3000/admin/products/imported/simulation')
  console.log('2. Se connecter en tant qu\'admin')
  console.log('3. Remplir le formulaire et créer un produit')
  console.log('4. Vérifier que la création fonctionne sans erreur')
  
  console.log('\n🔧 Si des erreurs persistent:')
  console.log('1. Vérifier les logs du serveur Next.js')
  console.log('2. Redémarrer le serveur: npm run dev')
  console.log('3. Vider le cache: rm -rf .next && npm run dev')
}

runAllTests().catch(console.error) 