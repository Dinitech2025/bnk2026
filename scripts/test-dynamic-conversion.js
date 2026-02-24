const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Fonction de conversion dynamique (copie de lib/utils.ts)
function convertCurrency(amount, fromCurrency, toCurrency, exchangeRates) {
  if (fromCurrency === toCurrency) {
    return amount
  }
  
  // Convertir d'abord vers MGA (devise de base)
  let amountInMGA = amount
  if (fromCurrency !== 'MGA') {
    const fromRate = exchangeRates[fromCurrency]
    if (!fromRate) {
      console.warn(`Taux de change non trouvé pour ${fromCurrency}`)
      return amount
    }
    // Convertir vers MGA : diviser par le taux
    amountInMGA = amount / fromRate
  }
  
  // Convertir de MGA vers la devise cible
  if (toCurrency === 'MGA') {
    return amountInMGA
  }
  
  const toRate = exchangeRates[toCurrency]
  if (!toRate) {
    console.warn(`Taux de change non trouvé pour ${toCurrency}`)
    return amount
  }
  
  // Convertir de MGA vers la devise cible : multiplier par le taux
  return amountInMGA * toRate
}

async function testDynamicConversion() {
  console.log('🧪 Test de conversion dynamique des devises\n')
  
  try {
    // 1. Récupérer les taux de change depuis la base de données
    console.log('1️⃣ Récupération des taux de change depuis la base...')
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'exchangeRate_'
        }
      }
    })
    
    const exchangeRates = {}
    settings.forEach(setting => {
      const currency = setting.key.replace('exchangeRate_', '')
      exchangeRates[currency] = parseFloat(setting.value)
    })
    
    console.log(`   ✅ ${Object.keys(exchangeRates).length} taux de change récupérés`)
    
    // 2. Tests de conversion
    console.log('\n2️⃣ Tests de conversion:')
    
    const testCases = [
      { amount: 100, from: 'MGA', to: 'EUR', description: '100 MGA → EUR' },
      { amount: 50, from: 'EUR', to: 'MGA', description: '50 EUR → MGA' },
      { amount: 25, from: 'USD', to: 'EUR', description: '25 USD → EUR' },
      { amount: 1000, from: 'MGA', to: 'USD', description: '1000 MGA → USD' },
      { amount: 10, from: 'GBP', to: 'CHF', description: '10 GBP → CHF' }
    ]
    
    testCases.forEach(test => {
      const result = convertCurrency(test.amount, test.from, test.to, exchangeRates)
      console.log(`   ${test.description}: ${result.toFixed(6)}`)
    })
    
    // 3. Vérification de la cohérence (conversion aller-retour)
    console.log('\n3️⃣ Test de cohérence (conversion aller-retour):')
    
    const originalAmount = 100
    const eurAmount = convertCurrency(originalAmount, 'MGA', 'EUR', exchangeRates)
    const backToMGA = convertCurrency(eurAmount, 'EUR', 'MGA', exchangeRates)
    const difference = Math.abs(originalAmount - backToMGA)
    
    console.log(`   Original: ${originalAmount} MGA`)
    console.log(`   → EUR: ${eurAmount.toFixed(6)} EUR`)
    console.log(`   → MGA: ${backToMGA.toFixed(6)} MGA`)
    console.log(`   Différence: ${difference.toFixed(6)} MGA`)
    
    if (difference < 0.01) {
      console.log('   ✅ Cohérence parfaite!')
    } else {
      console.log('   ⚠️ Petite différence due aux arrondis')
    }
    
    // 4. Affichage des taux principaux
    console.log('\n4️⃣ Taux de change principaux (1 MGA =):')
    const mainCurrencies = ['EUR', 'USD', 'GBP', 'CHF']
    
    mainCurrencies.forEach(currency => {
      if (exchangeRates[currency]) {
        const rate = exchangeRates[currency]
        console.log(`   1 MGA = ${rate.toFixed(6)} ${currency}`)
      } else {
        console.log(`   ❌ Taux non trouvé pour ${currency}`)
      }
    })
    
    console.log('\n✅ Test de conversion dynamique terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testDynamicConversion() 

const prisma = new PrismaClient()

// Fonction de conversion dynamique (copie de lib/utils.ts)
function convertCurrency(amount, fromCurrency, toCurrency, exchangeRates) {
  if (fromCurrency === toCurrency) {
    return amount
  }
  
  // Convertir d'abord vers MGA (devise de base)
  let amountInMGA = amount
  if (fromCurrency !== 'MGA') {
    const fromRate = exchangeRates[fromCurrency]
    if (!fromRate) {
      console.warn(`Taux de change non trouvé pour ${fromCurrency}`)
      return amount
    }
    // Convertir vers MGA : diviser par le taux
    amountInMGA = amount / fromRate
  }
  
  // Convertir de MGA vers la devise cible
  if (toCurrency === 'MGA') {
    return amountInMGA
  }
  
  const toRate = exchangeRates[toCurrency]
  if (!toRate) {
    console.warn(`Taux de change non trouvé pour ${toCurrency}`)
    return amount
  }
  
  // Convertir de MGA vers la devise cible : multiplier par le taux
  return amountInMGA * toRate
}

async function testDynamicConversion() {
  console.log('🧪 Test de conversion dynamique des devises\n')
  
  try {
    // 1. Récupérer les taux de change depuis la base de données
    console.log('1️⃣ Récupération des taux de change depuis la base...')
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'exchangeRate_'
        }
      }
    })
    
    const exchangeRates = {}
    settings.forEach(setting => {
      const currency = setting.key.replace('exchangeRate_', '')
      exchangeRates[currency] = parseFloat(setting.value)
    })
    
    console.log(`   ✅ ${Object.keys(exchangeRates).length} taux de change récupérés`)
    
    // 2. Tests de conversion
    console.log('\n2️⃣ Tests de conversion:')
    
    const testCases = [
      { amount: 100, from: 'MGA', to: 'EUR', description: '100 MGA → EUR' },
      { amount: 50, from: 'EUR', to: 'MGA', description: '50 EUR → MGA' },
      { amount: 25, from: 'USD', to: 'EUR', description: '25 USD → EUR' },
      { amount: 1000, from: 'MGA', to: 'USD', description: '1000 MGA → USD' },
      { amount: 10, from: 'GBP', to: 'CHF', description: '10 GBP → CHF' }
    ]
    
    testCases.forEach(test => {
      const result = convertCurrency(test.amount, test.from, test.to, exchangeRates)
      console.log(`   ${test.description}: ${result.toFixed(6)}`)
    })
    
    // 3. Vérification de la cohérence (conversion aller-retour)
    console.log('\n3️⃣ Test de cohérence (conversion aller-retour):')
    
    const originalAmount = 100
    const eurAmount = convertCurrency(originalAmount, 'MGA', 'EUR', exchangeRates)
    const backToMGA = convertCurrency(eurAmount, 'EUR', 'MGA', exchangeRates)
    const difference = Math.abs(originalAmount - backToMGA)
    
    console.log(`   Original: ${originalAmount} MGA`)
    console.log(`   → EUR: ${eurAmount.toFixed(6)} EUR`)
    console.log(`   → MGA: ${backToMGA.toFixed(6)} MGA`)
    console.log(`   Différence: ${difference.toFixed(6)} MGA`)
    
    if (difference < 0.01) {
      console.log('   ✅ Cohérence parfaite!')
    } else {
      console.log('   ⚠️ Petite différence due aux arrondis')
    }
    
    // 4. Affichage des taux principaux
    console.log('\n4️⃣ Taux de change principaux (1 MGA =):')
    const mainCurrencies = ['EUR', 'USD', 'GBP', 'CHF']
    
    mainCurrencies.forEach(currency => {
      if (exchangeRates[currency]) {
        const rate = exchangeRates[currency]
        console.log(`   1 MGA = ${rate.toFixed(6)} ${currency}`)
      } else {
        console.log(`   ❌ Taux non trouvé pour ${currency}`)
      }
    })
    
    console.log('\n✅ Test de conversion dynamique terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testDynamicConversion() 