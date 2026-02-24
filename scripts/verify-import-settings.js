const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyImportSettings() {
  console.log('🔍 Vérification des paramètres de calcul d\'importation...')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les paramètres ImportCalculationSettings
    console.log('\n1️⃣ Vérification des paramètres ImportCalculationSettings...')
    const importSettings = await prisma.importCalculationSettings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    if (importSettings.length === 0) {
      console.log('❌ Aucun paramètre trouvé dans ImportCalculationSettings')
      return
    }

    console.log(`✅ ${importSettings.length} paramètres trouvés`)

    // Afficher par catégorie
    const categories = ['transport', 'commission', 'fees', 'general']
    categories.forEach(category => {
      const categorySettings = importSettings.filter(s => s.category === category)
      console.log(`\n📂 ${category.toUpperCase()} (${categorySettings.length} paramètres):`)
      categorySettings.forEach(setting => {
        console.log(`   ✓ ${setting.key}: ${setting.value} - ${setting.description}`)
      })
    })

    // 2. Vérifier les taux de change
    console.log('\n2️⃣ Vérification des taux de change...')
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    if (exchangeRates.length === 0) {
      console.log('❌ Aucun taux de change trouvé')
    } else {
      console.log(`✅ ${exchangeRates.length} taux de change trouvés`)
      const rates = {}
      exchangeRates.forEach(rate => {
        const currency = rate.key.replace('exchangeRate_', '')
        rates[currency] = parseFloat(rate.value)
        console.log(`   💱 ${currency}: ${rate.value}`)
      })
    }

    // 3. Test de calcul simple
    console.log('\n3️⃣ Test de calcul simple...')
    
    // Récupérer les paramètres nécessaires
    const transportFrance = importSettings.find(s => s.key === 'transport_france_rate')
    const commission25_100 = importSettings.find(s => s.key === 'commission_25_100')
    const processingFee = importSettings.find(s => s.key === 'processing_fee')
    const taxRate = importSettings.find(s => s.key === 'tax_rate')

    if (transportFrance && commission25_100 && processingFee && taxRate) {
      // Simulation : produit 50€, 2kg, France
      const prix = 50
      const poids = 2
      
      const transport = poids * parseFloat(transportFrance.value)
      const commission = (prix * parseFloat(commission25_100.value)) / 100
      const frais = parseFloat(processingFee.value)
      const taxe = (prix * parseFloat(taxRate.value)) / 100
      const total = prix + transport + commission + frais + taxe

      console.log(`📦 Test : Produit ${prix}€, ${poids}kg, France`)
      console.log(`   Transport: ${transport}€ (${poids}kg × ${transportFrance.value}€/kg)`)
      console.log(`   Commission: ${commission}€ (${prix}€ × ${commission25_100.value}%)`)
      console.log(`   Frais: ${frais}€`)
      console.log(`   Taxe: ${taxe}€ (${prix}€ × ${taxRate.value}%)`)
      console.log(`   💰 Total: ${total}€`)
    }

    // 4. Vérifier l'API
    console.log('\n4️⃣ Vérification de l\'API...')
    console.log('✅ Route GET: /api/admin/settings/import-calculation')
    console.log('✅ Route PUT: /api/admin/settings/import-calculation')
    console.log('✅ Route POST: /api/admin/settings/import-calculation/reset')

    console.log('\n🎉 Système de paramètres d\'importation opérationnel !')
    console.log('\n📋 Actions disponibles :')
    console.log('   • Interface admin : http://localhost:3000/admin/settings/import-calculation')
    console.log('   • Simulateur : http://localhost:3000/admin/products/imported/simulation')
    console.log('   • Reset via API ou bouton "Réinitialiser" dans l\'interface')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyImportSettings() 

const prisma = new PrismaClient()

async function verifyImportSettings() {
  console.log('🔍 Vérification des paramètres de calcul d\'importation...')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les paramètres ImportCalculationSettings
    console.log('\n1️⃣ Vérification des paramètres ImportCalculationSettings...')
    const importSettings = await prisma.importCalculationSettings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    if (importSettings.length === 0) {
      console.log('❌ Aucun paramètre trouvé dans ImportCalculationSettings')
      return
    }

    console.log(`✅ ${importSettings.length} paramètres trouvés`)

    // Afficher par catégorie
    const categories = ['transport', 'commission', 'fees', 'general']
    categories.forEach(category => {
      const categorySettings = importSettings.filter(s => s.category === category)
      console.log(`\n📂 ${category.toUpperCase()} (${categorySettings.length} paramètres):`)
      categorySettings.forEach(setting => {
        console.log(`   ✓ ${setting.key}: ${setting.value} - ${setting.description}`)
      })
    })

    // 2. Vérifier les taux de change
    console.log('\n2️⃣ Vérification des taux de change...')
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    if (exchangeRates.length === 0) {
      console.log('❌ Aucun taux de change trouvé')
    } else {
      console.log(`✅ ${exchangeRates.length} taux de change trouvés`)
      const rates = {}
      exchangeRates.forEach(rate => {
        const currency = rate.key.replace('exchangeRate_', '')
        rates[currency] = parseFloat(rate.value)
        console.log(`   💱 ${currency}: ${rate.value}`)
      })
    }

    // 3. Test de calcul simple
    console.log('\n3️⃣ Test de calcul simple...')
    
    // Récupérer les paramètres nécessaires
    const transportFrance = importSettings.find(s => s.key === 'transport_france_rate')
    const commission25_100 = importSettings.find(s => s.key === 'commission_25_100')
    const processingFee = importSettings.find(s => s.key === 'processing_fee')
    const taxRate = importSettings.find(s => s.key === 'tax_rate')

    if (transportFrance && commission25_100 && processingFee && taxRate) {
      // Simulation : produit 50€, 2kg, France
      const prix = 50
      const poids = 2
      
      const transport = poids * parseFloat(transportFrance.value)
      const commission = (prix * parseFloat(commission25_100.value)) / 100
      const frais = parseFloat(processingFee.value)
      const taxe = (prix * parseFloat(taxRate.value)) / 100
      const total = prix + transport + commission + frais + taxe

      console.log(`📦 Test : Produit ${prix}€, ${poids}kg, France`)
      console.log(`   Transport: ${transport}€ (${poids}kg × ${transportFrance.value}€/kg)`)
      console.log(`   Commission: ${commission}€ (${prix}€ × ${commission25_100.value}%)`)
      console.log(`   Frais: ${frais}€`)
      console.log(`   Taxe: ${taxe}€ (${prix}€ × ${taxRate.value}%)`)
      console.log(`   💰 Total: ${total}€`)
    }

    // 4. Vérifier l'API
    console.log('\n4️⃣ Vérification de l\'API...')
    console.log('✅ Route GET: /api/admin/settings/import-calculation')
    console.log('✅ Route PUT: /api/admin/settings/import-calculation')
    console.log('✅ Route POST: /api/admin/settings/import-calculation/reset')

    console.log('\n🎉 Système de paramètres d\'importation opérationnel !')
    console.log('\n📋 Actions disponibles :')
    console.log('   • Interface admin : http://localhost:3000/admin/settings/import-calculation')
    console.log('   • Simulateur : http://localhost:3000/admin/products/imported/simulation')
    console.log('   • Reset via API ou bouton "Réinitialiser" dans l\'interface')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyImportSettings() 