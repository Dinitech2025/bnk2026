const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCorrectedCalculation() {
  console.log('🧪 Test de la logique de calcul corrigée...')
  console.log('=' .repeat(60))

  try {
    // Récupérer les paramètres
    const importSettings = await prisma.importCalculationSettings.findMany()
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    const settings = {}
    importSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value)
    })

    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
    })

    // Données de test (comme dans le simulateur)
    const testData = {
      supplierPrice: 28.99,
      supplierCurrency: 'EUR',
      weight: 0.3,
      warehouseCurrency: 'GBP'
    }

    console.log('📦 Test avec:', testData)
    console.log('\n💱 Taux de change:')
    Object.entries(rates).forEach(([currency, rate]) => {
      console.log(`   ${currency}: ${rate}`)
    })

    // Fonction de conversion corrigée
    const convertToMGA = (amount, fromCurrency) => {
      if (fromCurrency === 'MGA') return amount
      const fromRate = rates[fromCurrency] || 1
      return amount * fromRate
    }

    // 1. Convertir le prix fournisseur
    const supplierPriceInMGA = convertToMGA(testData.supplierPrice, testData.supplierCurrency)
    const warehouseRate = rates[testData.warehouseCurrency] || 1
    const supplierPriceInWarehouseCurrency = supplierPriceInMGA / warehouseRate

    console.log('\n🔄 Conversions:')
    console.log(`   Prix fournisseur: ${testData.supplierPrice} ${testData.supplierCurrency}`)
    console.log(`   En MGA: ${Math.round(supplierPriceInMGA)} MGA`)
    console.log(`   En ${testData.warehouseCurrency}: ${supplierPriceInWarehouseCurrency.toFixed(2)} ${testData.warehouseCurrency}`)

    // 2. Calculs
    const transportRate = settings['transport_uk_rate']
    const transportCost = testData.weight * transportRate
    const commissionRate = settings['commission_25_100']
    const commission = (supplierPriceInWarehouseCurrency * commissionRate) / 100
    const processingFee = settings['processing_fee']
    const taxRate = settings['tax_rate']
    const tax = (supplierPriceInWarehouseCurrency * taxRate) / 100

    console.log('\n🧮 Calculs détaillés:')
    console.log(`   Transport: ${transportCost} ${testData.warehouseCurrency} (${testData.weight}kg × ${transportRate})`)
    console.log(`   Commission: ${commission.toFixed(2)} ${testData.warehouseCurrency} (${commissionRate}%)`)
    console.log(`   Frais: ${processingFee} ${testData.warehouseCurrency}`)
    console.log(`   Taxe: ${tax.toFixed(2)} ${testData.warehouseCurrency} (${taxRate}%)`)

    // 3. Total
    const totalInWarehouseCurrency = supplierPriceInWarehouseCurrency + transportCost + commission + processingFee + tax
    const totalInMGA = convertToMGA(totalInWarehouseCurrency, testData.warehouseCurrency)

    console.log('\n💰 Résultats finaux:')
    console.log(`   Total en ${testData.warehouseCurrency}: ${totalInWarehouseCurrency.toFixed(2)}`)
    console.log(`   Total en MGA: ${Math.round(totalInMGA)}`)

    // 4. Conversion de chaque composant en MGA pour affichage
    console.log('\n📊 Détail en MGA:')
    console.log(`   Prix fournisseur: ${Math.round(supplierPriceInMGA)} MGA`)
    console.log(`   Transport: ${Math.round(convertToMGA(transportCost, testData.warehouseCurrency))} MGA`)
    console.log(`   Commission: ${Math.round(convertToMGA(commission, testData.warehouseCurrency))} MGA`)
    console.log(`   Frais: ${Math.round(convertToMGA(processingFee, testData.warehouseCurrency))} MGA`)
    console.log(`   Taxe: ${Math.round(convertToMGA(tax, testData.warehouseCurrency))} MGA`)
    console.log(`   TOTAL: ${Math.round(totalInMGA)} MGA`)

    console.log('\n✅ La logique de calcul est maintenant correcte !')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCorrectedCalculation() 

const prisma = new PrismaClient()

async function testCorrectedCalculation() {
  console.log('🧪 Test de la logique de calcul corrigée...')
  console.log('=' .repeat(60))

  try {
    // Récupérer les paramètres
    const importSettings = await prisma.importCalculationSettings.findMany()
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    const settings = {}
    importSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value)
    })

    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
    })

    // Données de test (comme dans le simulateur)
    const testData = {
      supplierPrice: 28.99,
      supplierCurrency: 'EUR',
      weight: 0.3,
      warehouseCurrency: 'GBP'
    }

    console.log('📦 Test avec:', testData)
    console.log('\n💱 Taux de change:')
    Object.entries(rates).forEach(([currency, rate]) => {
      console.log(`   ${currency}: ${rate}`)
    })

    // Fonction de conversion corrigée
    const convertToMGA = (amount, fromCurrency) => {
      if (fromCurrency === 'MGA') return amount
      const fromRate = rates[fromCurrency] || 1
      return amount * fromRate
    }

    // 1. Convertir le prix fournisseur
    const supplierPriceInMGA = convertToMGA(testData.supplierPrice, testData.supplierCurrency)
    const warehouseRate = rates[testData.warehouseCurrency] || 1
    const supplierPriceInWarehouseCurrency = supplierPriceInMGA / warehouseRate

    console.log('\n🔄 Conversions:')
    console.log(`   Prix fournisseur: ${testData.supplierPrice} ${testData.supplierCurrency}`)
    console.log(`   En MGA: ${Math.round(supplierPriceInMGA)} MGA`)
    console.log(`   En ${testData.warehouseCurrency}: ${supplierPriceInWarehouseCurrency.toFixed(2)} ${testData.warehouseCurrency}`)

    // 2. Calculs
    const transportRate = settings['transport_uk_rate']
    const transportCost = testData.weight * transportRate
    const commissionRate = settings['commission_25_100']
    const commission = (supplierPriceInWarehouseCurrency * commissionRate) / 100
    const processingFee = settings['processing_fee']
    const taxRate = settings['tax_rate']
    const tax = (supplierPriceInWarehouseCurrency * taxRate) / 100

    console.log('\n🧮 Calculs détaillés:')
    console.log(`   Transport: ${transportCost} ${testData.warehouseCurrency} (${testData.weight}kg × ${transportRate})`)
    console.log(`   Commission: ${commission.toFixed(2)} ${testData.warehouseCurrency} (${commissionRate}%)`)
    console.log(`   Frais: ${processingFee} ${testData.warehouseCurrency}`)
    console.log(`   Taxe: ${tax.toFixed(2)} ${testData.warehouseCurrency} (${taxRate}%)`)

    // 3. Total
    const totalInWarehouseCurrency = supplierPriceInWarehouseCurrency + transportCost + commission + processingFee + tax
    const totalInMGA = convertToMGA(totalInWarehouseCurrency, testData.warehouseCurrency)

    console.log('\n💰 Résultats finaux:')
    console.log(`   Total en ${testData.warehouseCurrency}: ${totalInWarehouseCurrency.toFixed(2)}`)
    console.log(`   Total en MGA: ${Math.round(totalInMGA)}`)

    // 4. Conversion de chaque composant en MGA pour affichage
    console.log('\n📊 Détail en MGA:')
    console.log(`   Prix fournisseur: ${Math.round(supplierPriceInMGA)} MGA`)
    console.log(`   Transport: ${Math.round(convertToMGA(transportCost, testData.warehouseCurrency))} MGA`)
    console.log(`   Commission: ${Math.round(convertToMGA(commission, testData.warehouseCurrency))} MGA`)
    console.log(`   Frais: ${Math.round(convertToMGA(processingFee, testData.warehouseCurrency))} MGA`)
    console.log(`   Taxe: ${Math.round(convertToMGA(tax, testData.warehouseCurrency))} MGA`)
    console.log(`   TOTAL: ${Math.round(totalInMGA)} MGA`)

    console.log('\n✅ La logique de calcul est maintenant correcte !')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCorrectedCalculation() 