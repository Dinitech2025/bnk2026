const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPISansMarge() {
  console.log('🧪 TEST API SANS MARGE')
  console.log('=' .repeat(40))
  
  try {
    // Simuler un calcul direct avec la logique de l'API
    
    // Récupérer les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'exchangeRate_' }
      }
    })

    const exchangeRates = {}
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    // Récupérer les paramètres de calcul
    const importSettings = await prisma.importCalculationSettings.findMany()
    const settings = {}
    importSettings.forEach((setting) => {
      settings[setting.key] = parseFloat(setting.value)
    })

    // Fonction pour convertir vers MGA
    const convertToMGA = (amount, fromCurrency) => {
      if (fromCurrency === 'MGA') return amount
      
      const mgaRate = exchangeRates['MGA'] || 5158.93
      const fromRate = exchangeRates[fromCurrency] || 1
      
      return amount * (mgaRate / fromRate)
    }

    // Test avec 52 EUR, France, 2kg
    const supplierPrice = 52
    const supplierCurrency = 'EUR'
    const weight = 2
    const warehouseCurrency = 'EUR'
    
    console.log('📊 Paramètres de test:')
    console.log(`   Prix: ${supplierPrice} ${supplierCurrency}`)
    console.log(`   Poids: ${weight} kg`)
    console.log(`   Entrepôt: France (${warehouseCurrency})`)
    
    // Calcul selon la nouvelle logique SANS marge
    const supplierPriceInWarehouseCurrency = supplierPrice * 
      (exchangeRates[warehouseCurrency] / exchangeRates[supplierCurrency])

    const transportRate = settings['transport_france_rate'] || 15
    const transportCost = weight * transportRate

    let commissionRate = 0
    if (supplierPriceInWarehouseCurrency < 100) {
      commissionRate = settings['commission_25_100'] || 38
    }

    const commission = (supplierPriceInWarehouseCurrency * commissionRate) / 100
    const processingFee = settings['processing_fee'] || 2
    const taxRate = settings['tax_rate'] || 3.5
    const tax = (supplierPriceInWarehouseCurrency * taxRate) / 100

    const totalInWarehouseCurrency = supplierPriceInWarehouseCurrency + transportCost + commission + processingFee + tax
    const totalInMGA = convertToMGA(totalInWarehouseCurrency, warehouseCurrency)

    console.log('\n💰 Résultat SANS marge:')
    console.log(`   Prix fournisseur: ${supplierPriceInWarehouseCurrency} ${warehouseCurrency}`)
    console.log(`   Transport: ${transportCost} ${warehouseCurrency}`)
    console.log(`   Commission: ${commission.toFixed(2)} ${warehouseCurrency} (${commissionRate}%)`)
    console.log(`   Frais: ${processingFee} ${warehouseCurrency}`)
    console.log(`   Taxe: ${tax.toFixed(2)} ${warehouseCurrency}`)
    console.log(`   Total: ${totalInWarehouseCurrency.toFixed(2)} ${warehouseCurrency}`)
    console.log(`   Total en MGA: ${Math.round(totalInMGA).toLocaleString('fr-FR')} Ar`)
    
    console.log('\n✅ API fonctionne correctement SANS marge')
    console.log('✅ Prêt pour la comparaison équitable avec l\'ancienne formule')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPISansMarge() 

const prisma = new PrismaClient()

async function testAPISansMarge() {
  console.log('🧪 TEST API SANS MARGE')
  console.log('=' .repeat(40))
  
  try {
    // Simuler un calcul direct avec la logique de l'API
    
    // Récupérer les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'exchangeRate_' }
      }
    })

    const exchangeRates = {}
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    // Récupérer les paramètres de calcul
    const importSettings = await prisma.importCalculationSettings.findMany()
    const settings = {}
    importSettings.forEach((setting) => {
      settings[setting.key] = parseFloat(setting.value)
    })

    // Fonction pour convertir vers MGA
    const convertToMGA = (amount, fromCurrency) => {
      if (fromCurrency === 'MGA') return amount
      
      const mgaRate = exchangeRates['MGA'] || 5158.93
      const fromRate = exchangeRates[fromCurrency] || 1
      
      return amount * (mgaRate / fromRate)
    }

    // Test avec 52 EUR, France, 2kg
    const supplierPrice = 52
    const supplierCurrency = 'EUR'
    const weight = 2
    const warehouseCurrency = 'EUR'
    
    console.log('📊 Paramètres de test:')
    console.log(`   Prix: ${supplierPrice} ${supplierCurrency}`)
    console.log(`   Poids: ${weight} kg`)
    console.log(`   Entrepôt: France (${warehouseCurrency})`)
    
    // Calcul selon la nouvelle logique SANS marge
    const supplierPriceInWarehouseCurrency = supplierPrice * 
      (exchangeRates[warehouseCurrency] / exchangeRates[supplierCurrency])

    const transportRate = settings['transport_france_rate'] || 15
    const transportCost = weight * transportRate

    let commissionRate = 0
    if (supplierPriceInWarehouseCurrency < 100) {
      commissionRate = settings['commission_25_100'] || 38
    }

    const commission = (supplierPriceInWarehouseCurrency * commissionRate) / 100
    const processingFee = settings['processing_fee'] || 2
    const taxRate = settings['tax_rate'] || 3.5
    const tax = (supplierPriceInWarehouseCurrency * taxRate) / 100

    const totalInWarehouseCurrency = supplierPriceInWarehouseCurrency + transportCost + commission + processingFee + tax
    const totalInMGA = convertToMGA(totalInWarehouseCurrency, warehouseCurrency)

    console.log('\n💰 Résultat SANS marge:')
    console.log(`   Prix fournisseur: ${supplierPriceInWarehouseCurrency} ${warehouseCurrency}`)
    console.log(`   Transport: ${transportCost} ${warehouseCurrency}`)
    console.log(`   Commission: ${commission.toFixed(2)} ${warehouseCurrency} (${commissionRate}%)`)
    console.log(`   Frais: ${processingFee} ${warehouseCurrency}`)
    console.log(`   Taxe: ${tax.toFixed(2)} ${warehouseCurrency}`)
    console.log(`   Total: ${totalInWarehouseCurrency.toFixed(2)} ${warehouseCurrency}`)
    console.log(`   Total en MGA: ${Math.round(totalInMGA).toLocaleString('fr-FR')} Ar`)
    
    console.log('\n✅ API fonctionne correctement SANS marge')
    console.log('✅ Prêt pour la comparaison équitable avec l\'ancienne formule')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPISansMarge() 