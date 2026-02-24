const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testHybridSystem() {
  console.log('🧪 Test du Système Hybride de Calcul d\'Importation')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les paramètres
    console.log('\n1️⃣ Vérification des paramètres...')
    const settings = await prisma.importCalculationSettings.findMany()
    console.log(`✅ ${settings.length} paramètres trouvés`)
    
    // Afficher les paramètres par catégorie
    const categories = ['transport', 'commission', 'fees', 'general']
    categories.forEach(category => {
      const categorySettings = settings.filter(s => s.category === category)
      console.log(`\n📂 ${category.toUpperCase()}:`)
      categorySettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value} (${setting.description})`)
      })
    })

    // 2. Vérifier les taux de change
    console.log('\n2️⃣ Vérification des taux de change...')
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    console.log(`✅ ${exchangeRates.length} taux de change trouvés`)
    
    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
    })
    
    console.log('💱 Taux principaux:')
    console.log(`   EUR: ${rates.EUR || 'N/A'}`)
    console.log(`   USD: ${rates.USD || 'N/A'}`)
    console.log(`   GBP: ${rates.GBP || 'N/A'}`)
    console.log(`   MGA: ${rates.MGA || 'N/A'}`)

    // 3. Simuler un calcul
    console.log('\n3️⃣ Simulation de calcul...')
    
    // Paramètres de test
    const testParams = {
      supplierPrice: 52,
      supplierCurrency: 'EUR',
      weight: 2,
      warehouse: 'france'
    }
    
    console.log('📦 Paramètres de test:')
    console.log(`   Prix fournisseur: ${testParams.supplierPrice} ${testParams.supplierCurrency}`)
    console.log(`   Poids: ${testParams.weight} kg`)
    console.log(`   Entrepôt: ${testParams.warehouse}`)
    
    // Récupérer les paramètres de calcul
    const settingsMap = {}
    settings.forEach(setting => {
      settingsMap[setting.key] = parseFloat(setting.value)
    })
    
    // Calculer selon la formule hybride
    const transportRate = settingsMap['transport_france_rate'] || 15
    const transportCost = testParams.weight * transportRate
    
    // Commission variable selon le prix
    let commissionRate = 0
    if (testParams.supplierPrice < 10) {
      commissionRate = settingsMap['commission_0_10'] || 25
    } else if (testParams.supplierPrice < 25) {
      commissionRate = settingsMap['commission_10_25'] || 35
    } else if (testParams.supplierPrice < 100) {
      commissionRate = settingsMap['commission_25_100'] || 38
    } else if (testParams.supplierPrice < 200) {
      commissionRate = settingsMap['commission_100_200'] || 30
    } else {
      commissionRate = settingsMap['commission_200_plus'] || 25
    }
    
    const commission = (testParams.supplierPrice * commissionRate) / 100
    const processingFee = settingsMap['processing_fee'] || 2
    const taxRate = settingsMap['tax_rate'] || 3.5
    const tax = (testParams.supplierPrice * taxRate) / 100
    
    const totalInEUR = testParams.supplierPrice + transportCost + commission + processingFee + tax
    const totalInMGA = totalInEUR * (rates.MGA / rates.EUR)
    
    console.log('\n💰 Résultats du calcul:')
    console.log(`   Transport: ${transportCost} EUR (${testParams.weight} kg × ${transportRate} EUR/kg)`)
    console.log(`   Commission: ${commission.toFixed(2)} EUR (${commissionRate}% de ${testParams.supplierPrice} EUR)`)
    console.log(`   Frais traitement: ${processingFee} EUR`)
    console.log(`   Taxe: ${tax.toFixed(2)} EUR (${taxRate}% de ${testParams.supplierPrice} EUR)`)
    console.log(`   ─────────────────────────────`)
    console.log(`   Total EUR: ${totalInEUR.toFixed(2)} EUR`)
    console.log(`   Total MGA: ${totalInMGA.toLocaleString('fr-FR')} Ar`)
    
    // Marge suggérée
    const marginRate = (settingsMap['margin_rate'] || 40) / 100
    const suggestedPrice = totalInMGA * (1 + marginRate)
    console.log(`   Prix suggéré: ${suggestedPrice.toLocaleString('fr-FR')} Ar (marge ${marginRate * 100}%)`)

    console.log('\n✅ Test du système hybride terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testHybridSystem() 

const prisma = new PrismaClient()

async function testHybridSystem() {
  console.log('🧪 Test du Système Hybride de Calcul d\'Importation')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier les paramètres
    console.log('\n1️⃣ Vérification des paramètres...')
    const settings = await prisma.importCalculationSettings.findMany()
    console.log(`✅ ${settings.length} paramètres trouvés`)
    
    // Afficher les paramètres par catégorie
    const categories = ['transport', 'commission', 'fees', 'general']
    categories.forEach(category => {
      const categorySettings = settings.filter(s => s.category === category)
      console.log(`\n📂 ${category.toUpperCase()}:`)
      categorySettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value} (${setting.description})`)
      })
    })

    // 2. Vérifier les taux de change
    console.log('\n2️⃣ Vérification des taux de change...')
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    console.log(`✅ ${exchangeRates.length} taux de change trouvés`)
    
    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
    })
    
    console.log('💱 Taux principaux:')
    console.log(`   EUR: ${rates.EUR || 'N/A'}`)
    console.log(`   USD: ${rates.USD || 'N/A'}`)
    console.log(`   GBP: ${rates.GBP || 'N/A'}`)
    console.log(`   MGA: ${rates.MGA || 'N/A'}`)

    // 3. Simuler un calcul
    console.log('\n3️⃣ Simulation de calcul...')
    
    // Paramètres de test
    const testParams = {
      supplierPrice: 52,
      supplierCurrency: 'EUR',
      weight: 2,
      warehouse: 'france'
    }
    
    console.log('📦 Paramètres de test:')
    console.log(`   Prix fournisseur: ${testParams.supplierPrice} ${testParams.supplierCurrency}`)
    console.log(`   Poids: ${testParams.weight} kg`)
    console.log(`   Entrepôt: ${testParams.warehouse}`)
    
    // Récupérer les paramètres de calcul
    const settingsMap = {}
    settings.forEach(setting => {
      settingsMap[setting.key] = parseFloat(setting.value)
    })
    
    // Calculer selon la formule hybride
    const transportRate = settingsMap['transport_france_rate'] || 15
    const transportCost = testParams.weight * transportRate
    
    // Commission variable selon le prix
    let commissionRate = 0
    if (testParams.supplierPrice < 10) {
      commissionRate = settingsMap['commission_0_10'] || 25
    } else if (testParams.supplierPrice < 25) {
      commissionRate = settingsMap['commission_10_25'] || 35
    } else if (testParams.supplierPrice < 100) {
      commissionRate = settingsMap['commission_25_100'] || 38
    } else if (testParams.supplierPrice < 200) {
      commissionRate = settingsMap['commission_100_200'] || 30
    } else {
      commissionRate = settingsMap['commission_200_plus'] || 25
    }
    
    const commission = (testParams.supplierPrice * commissionRate) / 100
    const processingFee = settingsMap['processing_fee'] || 2
    const taxRate = settingsMap['tax_rate'] || 3.5
    const tax = (testParams.supplierPrice * taxRate) / 100
    
    const totalInEUR = testParams.supplierPrice + transportCost + commission + processingFee + tax
    const totalInMGA = totalInEUR * (rates.MGA / rates.EUR)
    
    console.log('\n💰 Résultats du calcul:')
    console.log(`   Transport: ${transportCost} EUR (${testParams.weight} kg × ${transportRate} EUR/kg)`)
    console.log(`   Commission: ${commission.toFixed(2)} EUR (${commissionRate}% de ${testParams.supplierPrice} EUR)`)
    console.log(`   Frais traitement: ${processingFee} EUR`)
    console.log(`   Taxe: ${tax.toFixed(2)} EUR (${taxRate}% de ${testParams.supplierPrice} EUR)`)
    console.log(`   ─────────────────────────────`)
    console.log(`   Total EUR: ${totalInEUR.toFixed(2)} EUR`)
    console.log(`   Total MGA: ${totalInMGA.toLocaleString('fr-FR')} Ar`)
    
    // Marge suggérée
    const marginRate = (settingsMap['margin_rate'] || 40) / 100
    const suggestedPrice = totalInMGA * (1 + marginRate)
    console.log(`   Prix suggéré: ${suggestedPrice.toLocaleString('fr-FR')} Ar (marge ${marginRate * 100}%)`)

    console.log('\n✅ Test du système hybride terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testHybridSystem() 