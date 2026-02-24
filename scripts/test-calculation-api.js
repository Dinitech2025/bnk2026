const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCalculationAPI() {
  console.log('🧪 Test de l\'API de calcul d\'importation...')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les paramètres
    console.log('\n1️⃣ Vérification des paramètres...')
    const importSettings = await prisma.importCalculationSettings.findMany()
    console.log(`✅ ${importSettings.length} paramètres trouvés`)

    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    console.log(`✅ ${exchangeRates.length} taux de change trouvés`)

    // 2. Simuler une requête API
    console.log('\n2️⃣ Simulation d\'une requête API...')
    
    const testData = {
      mode: 'air',
      productName: 'Test Product',
      supplierPrice: 28.99,
      supplierCurrency: 'EUR',
      weight: 0.3,
      warehouse: 'uk'
    }

    console.log('📦 Données de test:', testData)

    // Simuler la logique de l'API
    const settings = {}
    importSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value)
    })

    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
    })

    console.log('\n📊 Paramètres récupérés:')
    console.log('Transport UK:', settings['transport_uk_rate'])
    console.log('Commission 25-100:', settings['commission_25_100'])
    console.log('Frais traitement:', settings['processing_fee'])
    console.log('Taux taxe:', settings['tax_rate'])

    console.log('\n💱 Taux de change:')
    console.log('EUR:', rates['EUR'])
    console.log('GBP:', rates['GBP'])
    console.log('MGA:', rates['MGA'])

    // Calcul manuel pour vérification
    const supplierPriceInGBP = testData.supplierPrice * (rates['GBP'] / rates['EUR'])
    const transport = testData.weight * settings['transport_uk_rate']
    const commission = (supplierPriceInGBP * settings['commission_25_100']) / 100
    const processing = settings['processing_fee']
    const tax = (supplierPriceInGBP * settings['tax_rate']) / 100
    const totalGBP = supplierPriceInGBP + transport + commission + processing + tax
    const totalMGA = totalGBP * rates['GBP']

    console.log('\n🧮 Calcul manuel:')
    console.log(`Prix fournisseur: ${testData.supplierPrice} EUR = ${supplierPriceInGBP.toFixed(2)} GBP`)
    console.log(`Transport: ${transport.toFixed(2)} GBP (${testData.weight}kg × ${settings['transport_uk_rate']}GBP/kg)`)
    console.log(`Commission: ${commission.toFixed(2)} GBP (${settings['commission_25_100']}%)`)
    console.log(`Frais: ${processing} GBP`)
    console.log(`Taxe: ${tax.toFixed(2)} GBP (${settings['tax_rate']}%)`)
    console.log(`Total: ${totalGBP.toFixed(2)} GBP = ${Math.round(totalMGA)} MGA`)

    // 3. Test avec fetch (si le serveur est en cours d'exécution)
    console.log('\n3️⃣ Test de l\'API via HTTP...')
    try {
      const response = await fetch('http://localhost:3000/api/admin/products/imported/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Response:', JSON.stringify(result, null, 2))
      } else {
        console.log('❌ API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.log('⚠️ Impossible de tester l\'API HTTP (serveur non démarré?)')
      console.log('   Erreur:', error.message)
    }

    console.log('\n🎉 Test terminé !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCalculationAPI() 

const prisma = new PrismaClient()

async function testCalculationAPI() {
  console.log('🧪 Test de l\'API de calcul d\'importation...')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les paramètres
    console.log('\n1️⃣ Vérification des paramètres...')
    const importSettings = await prisma.importCalculationSettings.findMany()
    console.log(`✅ ${importSettings.length} paramètres trouvés`)

    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    console.log(`✅ ${exchangeRates.length} taux de change trouvés`)

    // 2. Simuler une requête API
    console.log('\n2️⃣ Simulation d\'une requête API...')
    
    const testData = {
      mode: 'air',
      productName: 'Test Product',
      supplierPrice: 28.99,
      supplierCurrency: 'EUR',
      weight: 0.3,
      warehouse: 'uk'
    }

    console.log('📦 Données de test:', testData)

    // Simuler la logique de l'API
    const settings = {}
    importSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value)
    })

    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
    })

    console.log('\n📊 Paramètres récupérés:')
    console.log('Transport UK:', settings['transport_uk_rate'])
    console.log('Commission 25-100:', settings['commission_25_100'])
    console.log('Frais traitement:', settings['processing_fee'])
    console.log('Taux taxe:', settings['tax_rate'])

    console.log('\n💱 Taux de change:')
    console.log('EUR:', rates['EUR'])
    console.log('GBP:', rates['GBP'])
    console.log('MGA:', rates['MGA'])

    // Calcul manuel pour vérification
    const supplierPriceInGBP = testData.supplierPrice * (rates['GBP'] / rates['EUR'])
    const transport = testData.weight * settings['transport_uk_rate']
    const commission = (supplierPriceInGBP * settings['commission_25_100']) / 100
    const processing = settings['processing_fee']
    const tax = (supplierPriceInGBP * settings['tax_rate']) / 100
    const totalGBP = supplierPriceInGBP + transport + commission + processing + tax
    const totalMGA = totalGBP * rates['GBP']

    console.log('\n🧮 Calcul manuel:')
    console.log(`Prix fournisseur: ${testData.supplierPrice} EUR = ${supplierPriceInGBP.toFixed(2)} GBP`)
    console.log(`Transport: ${transport.toFixed(2)} GBP (${testData.weight}kg × ${settings['transport_uk_rate']}GBP/kg)`)
    console.log(`Commission: ${commission.toFixed(2)} GBP (${settings['commission_25_100']}%)`)
    console.log(`Frais: ${processing} GBP`)
    console.log(`Taxe: ${tax.toFixed(2)} GBP (${settings['tax_rate']}%)`)
    console.log(`Total: ${totalGBP.toFixed(2)} GBP = ${Math.round(totalMGA)} MGA`)

    // 3. Test avec fetch (si le serveur est en cours d'exécution)
    console.log('\n3️⃣ Test de l\'API via HTTP...')
    try {
      const response = await fetch('http://localhost:3000/api/admin/products/imported/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Response:', JSON.stringify(result, null, 2))
      } else {
        console.log('❌ API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.log('⚠️ Impossible de tester l\'API HTTP (serveur non démarré?)')
      console.log('   Erreur:', error.message)
    }

    console.log('\n🎉 Test terminé !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCalculationAPI() 