const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApiResponse() {
  console.log('🧪 TEST DE LA RÉPONSE API')
  console.log('=' .repeat(50))

  try {
    // Simuler les données d'entrée
    const testData = {
      mode: 'air',
      supplierPrice: 45,
      supplierCurrency: 'EUR',
      weight: 1,
      warehouse: 'france'
    }

    console.log('📥 Données d\'entrée:', testData)

    // Récupérer les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    const exchangeRates = {}
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    // Récupérer les paramètres
    const importSettings = await prisma.importCalculationSettings.findMany({
      where: {
        key: { 
          in: [
            'transport_france_rate', 'transport_usa_rate', 'transport_uk_rate', 'transport_china_rate',
            'commission_0_10', 'commission_10_25', 'commission_25_100', 
            'commission_100_200', 'commission_200_plus',
            'commission_threshold_1', 'commission_threshold_2', 'commission_threshold_3', 'commission_threshold_4',
            'processing_fee', 'tax_rate'
          ]
        }
      }
    })
    
    const settings = {}
    importSettings.forEach((setting) => {
      settings[setting.key] = parseFloat(setting.value || '0')
    })

    // Configuration entrepôt
    const warehouseConfig = { name: 'France', currency: 'EUR', origin: 'france' }

    // Fonction de conversion
    const convertToMGA = (amount, fromCurrency) => {
      if (fromCurrency === 'MGA') return amount
      const fromRate = exchangeRates[fromCurrency] || 1
      return amount / fromRate
    }

    const convertFromMGA = (amountInMGA, toCurrency) => {
      if (toCurrency === 'MGA') return amountInMGA
      const toRate = exchangeRates[toCurrency] || 1
      return amountInMGA * toRate
    }

    // Calculs
    const supplierPriceInMGA = convertToMGA(testData.supplierPrice, testData.supplierCurrency)
    
    const franceRate = settings['transport_france_rate'] || 15
    const transportRateInMGA = franceRate / (exchangeRates['EUR'] || 0.000196)
    const transportCostInMGA = testData.weight * transportRateInMGA

    const threshold2 = convertToMGA(settings['commission_threshold_2'] || 25, 'EUR')
    const threshold3 = convertToMGA(settings['commission_threshold_3'] || 100, 'EUR')
    
    let commissionRate = 0
    if (supplierPriceInMGA < threshold2) {
      commissionRate = settings['commission_10_25'] || 35
    } else if (supplierPriceInMGA < threshold3) {
      commissionRate = settings['commission_25_100'] || 38
    }

    const commissionInMGA = (supplierPriceInMGA * commissionRate) / 100
    const processingFeeRate = settings['processing_fee'] || 2
    const processingFeeInMGA = processingFeeRate / (exchangeRates[warehouseConfig.currency] || 1)
    const taxRate = settings['tax_rate'] || 3.5
    const taxInMGA = (supplierPriceInMGA * taxRate) / 100
    const totalInMGA = supplierPriceInMGA + transportCostInMGA + commissionInMGA + processingFeeInMGA + taxInMGA

    // Construire la réponse comme l'API
    const calculation = {
      costs: {
        supplierPrice: {
          amount: testData.supplierPrice,
          currency: testData.supplierCurrency,
          amountInMGA: supplierPriceInMGA
        },
        transport: {
          amount: convertFromMGA(transportCostInMGA, warehouseConfig.currency),
          currency: warehouseConfig.currency,
          amountInMGA: transportCostInMGA
        },
        commission: {
          amount: convertFromMGA(commissionInMGA, warehouseConfig.currency),
          currency: warehouseConfig.currency,
          amountInMGA: commissionInMGA,
          rate: commissionRate
        },
        fees: {
          processing: {
            amount: convertFromMGA(processingFeeInMGA, warehouseConfig.currency),
            currency: warehouseConfig.currency,
            amountInMGA: processingFeeInMGA
          },
          tax: {
            amount: convertFromMGA(taxInMGA, warehouseConfig.currency),
            currency: warehouseConfig.currency,
            amountInMGA: taxInMGA,
            rate: taxRate
          }
        },
        total: totalInMGA
      }
    }

    console.log('\n📤 RÉPONSE API SIMULÉE:')
    console.log('=' .repeat(50))
    
    console.log('\n💰 Prix fournisseur:')
    console.log(`   amount: ${calculation.costs.supplierPrice.amount}`)
    console.log(`   currency: ${calculation.costs.supplierPrice.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.supplierPrice.amountInMGA.toFixed(0)}`)

    console.log('\n🚚 Transport:')
    console.log(`   amount: ${calculation.costs.transport.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.transport.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.transport.amountInMGA.toFixed(0)}`)

    console.log('\n💼 Commission:')
    console.log(`   amount: ${calculation.costs.commission.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.commission.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.commission.amountInMGA.toFixed(0)}`)
    console.log(`   rate: ${calculation.costs.commission.rate}%`)

    console.log('\n📋 Frais traitement:')
    console.log(`   amount: ${calculation.costs.fees.processing.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.fees.processing.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.fees.processing.amountInMGA.toFixed(0)}`)

    console.log('\n💸 Taxe:')
    console.log(`   amount: ${calculation.costs.fees.tax.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.fees.tax.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.fees.tax.amountInMGA.toFixed(0)}`)

    console.log('\n🎯 TOTAL:')
    console.log(`   total: ${calculation.costs.total.toFixed(0)} MGA`)

    // Test de formatDisplayPrice comme dans le frontend
    console.log('\n🖥️ SIMULATION FRONTEND:')
    console.log('=' .repeat(50))
    
    // Simuler formatDisplayPrice avec targetCurrency = 'GBP'
    const targetCurrency = 'GBP'
    const gbpRate = exchangeRates['GBP'] || 0.000168
    
    console.log(`\nTargetCurrency: ${targetCurrency}`)
    console.log(`GBP Rate: ${gbpRate}`)
    
    // Test pour le prix fournisseur
    const supplierOriginalAmount = calculation.costs.supplierPrice.amount
    const supplierOriginalCurrency = calculation.costs.supplierPrice.currency
    const supplierAmountInMGA = calculation.costs.supplierPrice.amountInMGA
    
    console.log('\n📊 Prix fournisseur - Frontend:')
    console.log(`   Original: ${supplierOriginalAmount} ${supplierOriginalCurrency}`)
    console.log(`   MGA: ${supplierAmountInMGA.toFixed(0)}`)
    
    if (supplierOriginalCurrency === targetCurrency) {
      console.log(`   ✅ Affichage: ${supplierOriginalAmount.toLocaleString('fr-FR')} £`)
    } else {
      const convertedAmount = supplierAmountInMGA * gbpRate
      console.log(`   ❌ Conversion: ${supplierAmountInMGA.toFixed(0)} × ${gbpRate} = ${convertedAmount.toFixed(2)} £`)
    }

    // Test pour le transport
    const transportOriginalAmount = calculation.costs.transport.amount
    const transportOriginalCurrency = calculation.costs.transport.currency
    const transportAmountInMGA = calculation.costs.transport.amountInMGA
    
    console.log('\n🚚 Transport - Frontend:')
    console.log(`   Original: ${transportOriginalAmount.toFixed(2)} ${transportOriginalCurrency}`)
    console.log(`   MGA: ${transportAmountInMGA.toFixed(0)}`)
    
    if (transportOriginalCurrency === targetCurrency) {
      console.log(`   ✅ Affichage: ${transportOriginalAmount.toLocaleString('fr-FR')} £`)
    } else {
      const convertedAmount = transportAmountInMGA * gbpRate
      console.log(`   ❌ Conversion: ${transportAmountInMGA.toFixed(0)} × ${gbpRate} = ${convertedAmount.toFixed(2)} £`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiResponse().catch(console.error) 

const prisma = new PrismaClient()

async function testApiResponse() {
  console.log('🧪 TEST DE LA RÉPONSE API')
  console.log('=' .repeat(50))

  try {
    // Simuler les données d'entrée
    const testData = {
      mode: 'air',
      supplierPrice: 45,
      supplierCurrency: 'EUR',
      weight: 1,
      warehouse: 'france'
    }

    console.log('📥 Données d\'entrée:', testData)

    // Récupérer les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    const exchangeRates = {}
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    // Récupérer les paramètres
    const importSettings = await prisma.importCalculationSettings.findMany({
      where: {
        key: { 
          in: [
            'transport_france_rate', 'transport_usa_rate', 'transport_uk_rate', 'transport_china_rate',
            'commission_0_10', 'commission_10_25', 'commission_25_100', 
            'commission_100_200', 'commission_200_plus',
            'commission_threshold_1', 'commission_threshold_2', 'commission_threshold_3', 'commission_threshold_4',
            'processing_fee', 'tax_rate'
          ]
        }
      }
    })
    
    const settings = {}
    importSettings.forEach((setting) => {
      settings[setting.key] = parseFloat(setting.value || '0')
    })

    // Configuration entrepôt
    const warehouseConfig = { name: 'France', currency: 'EUR', origin: 'france' }

    // Fonction de conversion
    const convertToMGA = (amount, fromCurrency) => {
      if (fromCurrency === 'MGA') return amount
      const fromRate = exchangeRates[fromCurrency] || 1
      return amount / fromRate
    }

    const convertFromMGA = (amountInMGA, toCurrency) => {
      if (toCurrency === 'MGA') return amountInMGA
      const toRate = exchangeRates[toCurrency] || 1
      return amountInMGA * toRate
    }

    // Calculs
    const supplierPriceInMGA = convertToMGA(testData.supplierPrice, testData.supplierCurrency)
    
    const franceRate = settings['transport_france_rate'] || 15
    const transportRateInMGA = franceRate / (exchangeRates['EUR'] || 0.000196)
    const transportCostInMGA = testData.weight * transportRateInMGA

    const threshold2 = convertToMGA(settings['commission_threshold_2'] || 25, 'EUR')
    const threshold3 = convertToMGA(settings['commission_threshold_3'] || 100, 'EUR')
    
    let commissionRate = 0
    if (supplierPriceInMGA < threshold2) {
      commissionRate = settings['commission_10_25'] || 35
    } else if (supplierPriceInMGA < threshold3) {
      commissionRate = settings['commission_25_100'] || 38
    }

    const commissionInMGA = (supplierPriceInMGA * commissionRate) / 100
    const processingFeeRate = settings['processing_fee'] || 2
    const processingFeeInMGA = processingFeeRate / (exchangeRates[warehouseConfig.currency] || 1)
    const taxRate = settings['tax_rate'] || 3.5
    const taxInMGA = (supplierPriceInMGA * taxRate) / 100
    const totalInMGA = supplierPriceInMGA + transportCostInMGA + commissionInMGA + processingFeeInMGA + taxInMGA

    // Construire la réponse comme l'API
    const calculation = {
      costs: {
        supplierPrice: {
          amount: testData.supplierPrice,
          currency: testData.supplierCurrency,
          amountInMGA: supplierPriceInMGA
        },
        transport: {
          amount: convertFromMGA(transportCostInMGA, warehouseConfig.currency),
          currency: warehouseConfig.currency,
          amountInMGA: transportCostInMGA
        },
        commission: {
          amount: convertFromMGA(commissionInMGA, warehouseConfig.currency),
          currency: warehouseConfig.currency,
          amountInMGA: commissionInMGA,
          rate: commissionRate
        },
        fees: {
          processing: {
            amount: convertFromMGA(processingFeeInMGA, warehouseConfig.currency),
            currency: warehouseConfig.currency,
            amountInMGA: processingFeeInMGA
          },
          tax: {
            amount: convertFromMGA(taxInMGA, warehouseConfig.currency),
            currency: warehouseConfig.currency,
            amountInMGA: taxInMGA,
            rate: taxRate
          }
        },
        total: totalInMGA
      }
    }

    console.log('\n📤 RÉPONSE API SIMULÉE:')
    console.log('=' .repeat(50))
    
    console.log('\n💰 Prix fournisseur:')
    console.log(`   amount: ${calculation.costs.supplierPrice.amount}`)
    console.log(`   currency: ${calculation.costs.supplierPrice.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.supplierPrice.amountInMGA.toFixed(0)}`)

    console.log('\n🚚 Transport:')
    console.log(`   amount: ${calculation.costs.transport.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.transport.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.transport.amountInMGA.toFixed(0)}`)

    console.log('\n💼 Commission:')
    console.log(`   amount: ${calculation.costs.commission.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.commission.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.commission.amountInMGA.toFixed(0)}`)
    console.log(`   rate: ${calculation.costs.commission.rate}%`)

    console.log('\n📋 Frais traitement:')
    console.log(`   amount: ${calculation.costs.fees.processing.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.fees.processing.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.fees.processing.amountInMGA.toFixed(0)}`)

    console.log('\n💸 Taxe:')
    console.log(`   amount: ${calculation.costs.fees.tax.amount.toFixed(2)}`)
    console.log(`   currency: ${calculation.costs.fees.tax.currency}`)
    console.log(`   amountInMGA: ${calculation.costs.fees.tax.amountInMGA.toFixed(0)}`)

    console.log('\n🎯 TOTAL:')
    console.log(`   total: ${calculation.costs.total.toFixed(0)} MGA`)

    // Test de formatDisplayPrice comme dans le frontend
    console.log('\n🖥️ SIMULATION FRONTEND:')
    console.log('=' .repeat(50))
    
    // Simuler formatDisplayPrice avec targetCurrency = 'GBP'
    const targetCurrency = 'GBP'
    const gbpRate = exchangeRates['GBP'] || 0.000168
    
    console.log(`\nTargetCurrency: ${targetCurrency}`)
    console.log(`GBP Rate: ${gbpRate}`)
    
    // Test pour le prix fournisseur
    const supplierOriginalAmount = calculation.costs.supplierPrice.amount
    const supplierOriginalCurrency = calculation.costs.supplierPrice.currency
    const supplierAmountInMGA = calculation.costs.supplierPrice.amountInMGA
    
    console.log('\n📊 Prix fournisseur - Frontend:')
    console.log(`   Original: ${supplierOriginalAmount} ${supplierOriginalCurrency}`)
    console.log(`   MGA: ${supplierAmountInMGA.toFixed(0)}`)
    
    if (supplierOriginalCurrency === targetCurrency) {
      console.log(`   ✅ Affichage: ${supplierOriginalAmount.toLocaleString('fr-FR')} £`)
    } else {
      const convertedAmount = supplierAmountInMGA * gbpRate
      console.log(`   ❌ Conversion: ${supplierAmountInMGA.toFixed(0)} × ${gbpRate} = ${convertedAmount.toFixed(2)} £`)
    }

    // Test pour le transport
    const transportOriginalAmount = calculation.costs.transport.amount
    const transportOriginalCurrency = calculation.costs.transport.currency
    const transportAmountInMGA = calculation.costs.transport.amountInMGA
    
    console.log('\n🚚 Transport - Frontend:')
    console.log(`   Original: ${transportOriginalAmount.toFixed(2)} ${transportOriginalCurrency}`)
    console.log(`   MGA: ${transportAmountInMGA.toFixed(0)}`)
    
    if (transportOriginalCurrency === targetCurrency) {
      console.log(`   ✅ Affichage: ${transportOriginalAmount.toLocaleString('fr-FR')} £`)
    } else {
      const convertedAmount = transportAmountInMGA * gbpRate
      console.log(`   ❌ Conversion: ${transportAmountInMGA.toFixed(0)} × ${gbpRate} = ${convertedAmount.toFixed(2)} £`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiResponse().catch(console.error) 