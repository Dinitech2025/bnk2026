const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configuration de l'API
const API_URL = 'https://api.fxratesapi.com/latest?api_key=fxr_live_870cf7ae2bcc27582b3379495e4e31fda2f1'

async function syncExchangeRates() {
  console.log('💱 Synchronisation des taux de change avec fxratesapi.com...')
  console.log('=' .repeat(60))

  try {
    // 1. Récupérer les taux depuis l'API
    console.log('\n1️⃣ Récupération des taux depuis fxratesapi.com...')
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error('Réponse API non valide')
    }
    
    console.log(`✅ Taux récupérés (base: ${data.base}, date: ${data.date})`)
    console.log(`📊 ${Object.keys(data.rates).length} devises disponibles`)

    // 2. Convertir les taux pour MGA comme devise de base
    console.log('\n2️⃣ Conversion des taux pour MGA comme devise de base...')
    
    // Taux de change approximatif USD/MGA (1 USD ≈ 4680 MGA)
    const usdToMgaRate = 4680
    
    const normalizedRates = {
      'MGA': 1.0 // MGA est notre devise de base
    }
    
    // Convertir tous les taux en MGA
    Object.entries(data.rates).forEach(([currency, usdRate]) => {
      if (currency !== 'MGA') {
        // 1 unité de cette devise = (1/usdRate) * usdToMgaRate MGA
        normalizedRates[currency] = usdToMgaRate / usdRate
      }
    })
    
    // Ajouter les devises importantes pour l'administration si elles ne sont pas présentes
    const importantCurrencies = {
      'EUR': 5100,
      'USD': 4680,
      'GBP': 5950,
      'CHF': 4200
    }
    
    Object.entries(importantCurrencies).forEach(([currency, fallbackRate]) => {
      if (!normalizedRates[currency]) {
        normalizedRates[currency] = fallbackRate
        console.log(`⚠️ ${currency} non trouvé dans l'API, utilisation du taux de fallback: ${fallbackRate}`)
      }
    })

    // 3. Mettre à jour la base de données
    console.log('\n3️⃣ Mise à jour de la base de données...')
    
    const now = new Date().toISOString()
    let updatedCount = 0
    
    // Supprimer les anciens taux de change
    await prisma.setting.deleteMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    
    // Ajouter les nouveaux taux
    for (const [currency, rate] of Object.entries(normalizedRates)) {
      await prisma.setting.create({
        data: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER'
        }
      })
      updatedCount++
    }
    
    // Mettre à jour la date de dernière mise à jour
    await prisma.setting.upsert({
      where: { key: 'exchange_rates_last_update' },
      update: { value: now },
      create: {
        key: 'exchange_rates_last_update',
        value: now,
        type: 'DATE'
      }
    })

    console.log(`✅ ${updatedCount} taux de change mis à jour`)

    // 4. Afficher les taux des devises importantes
    console.log('\n4️⃣ Taux des devises importantes:')
    const importantCurrencyList = ['MGA', 'EUR', 'USD', 'GBP', 'CHF']
    
    importantCurrencyList.forEach(currency => {
      if (normalizedRates[currency]) {
        const rate = normalizedRates[currency]
        if (currency === 'MGA') {
          console.log(`   ${currency}: ${rate} (devise de base)`)
        } else {
          console.log(`   ${currency}: ${Math.round(rate)} MGA (1 ${currency} = ${Math.round(rate)} MGA)`)
        }
      }
    })

    // 5. Test de calcul
    console.log('\n5️⃣ Test de calcul d\'importation:')
    const testPrice = 50 // EUR
    const testPriceInMGA = testPrice * normalizedRates['EUR']
    console.log(`   ${testPrice} EUR = ${Math.round(testPriceInMGA)} MGA`)

    console.log('\n🎉 Synchronisation terminée avec succès !')
    console.log(`📅 Dernière mise à jour: ${new Date(now).toLocaleString('fr-FR')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncExchangeRates() 

const prisma = new PrismaClient()

// Configuration de l'API
const API_URL = 'https://api.fxratesapi.com/latest?api_key=fxr_live_870cf7ae2bcc27582b3379495e4e31fda2f1'

async function syncExchangeRates() {
  console.log('💱 Synchronisation des taux de change avec fxratesapi.com...')
  console.log('=' .repeat(60))

  try {
    // 1. Récupérer les taux depuis l'API
    console.log('\n1️⃣ Récupération des taux depuis fxratesapi.com...')
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error('Réponse API non valide')
    }
    
    console.log(`✅ Taux récupérés (base: ${data.base}, date: ${data.date})`)
    console.log(`📊 ${Object.keys(data.rates).length} devises disponibles`)

    // 2. Convertir les taux pour MGA comme devise de base
    console.log('\n2️⃣ Conversion des taux pour MGA comme devise de base...')
    
    // Taux de change approximatif USD/MGA (1 USD ≈ 4680 MGA)
    const usdToMgaRate = 4680
    
    const normalizedRates = {
      'MGA': 1.0 // MGA est notre devise de base
    }
    
    // Convertir tous les taux en MGA
    Object.entries(data.rates).forEach(([currency, usdRate]) => {
      if (currency !== 'MGA') {
        // 1 unité de cette devise = (1/usdRate) * usdToMgaRate MGA
        normalizedRates[currency] = usdToMgaRate / usdRate
      }
    })
    
    // Ajouter les devises importantes pour l'administration si elles ne sont pas présentes
    const importantCurrencies = {
      'EUR': 5100,
      'USD': 4680,
      'GBP': 5950,
      'CHF': 4200
    }
    
    Object.entries(importantCurrencies).forEach(([currency, fallbackRate]) => {
      if (!normalizedRates[currency]) {
        normalizedRates[currency] = fallbackRate
        console.log(`⚠️ ${currency} non trouvé dans l'API, utilisation du taux de fallback: ${fallbackRate}`)
      }
    })

    // 3. Mettre à jour la base de données
    console.log('\n3️⃣ Mise à jour de la base de données...')
    
    const now = new Date().toISOString()
    let updatedCount = 0
    
    // Supprimer les anciens taux de change
    await prisma.setting.deleteMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    
    // Ajouter les nouveaux taux
    for (const [currency, rate] of Object.entries(normalizedRates)) {
      await prisma.setting.create({
        data: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER'
        }
      })
      updatedCount++
    }
    
    // Mettre à jour la date de dernière mise à jour
    await prisma.setting.upsert({
      where: { key: 'exchange_rates_last_update' },
      update: { value: now },
      create: {
        key: 'exchange_rates_last_update',
        value: now,
        type: 'DATE'
      }
    })

    console.log(`✅ ${updatedCount} taux de change mis à jour`)

    // 4. Afficher les taux des devises importantes
    console.log('\n4️⃣ Taux des devises importantes:')
    const importantCurrencyList = ['MGA', 'EUR', 'USD', 'GBP', 'CHF']
    
    importantCurrencyList.forEach(currency => {
      if (normalizedRates[currency]) {
        const rate = normalizedRates[currency]
        if (currency === 'MGA') {
          console.log(`   ${currency}: ${rate} (devise de base)`)
        } else {
          console.log(`   ${currency}: ${Math.round(rate)} MGA (1 ${currency} = ${Math.round(rate)} MGA)`)
        }
      }
    })

    // 5. Test de calcul
    console.log('\n5️⃣ Test de calcul d\'importation:')
    const testPrice = 50 // EUR
    const testPriceInMGA = testPrice * normalizedRates['EUR']
    console.log(`   ${testPrice} EUR = ${Math.round(testPriceInMGA)} MGA`)

    console.log('\n🎉 Synchronisation terminée avec succès !')
    console.log(`📅 Dernière mise à jour: ${new Date(now).toLocaleString('fr-FR')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncExchangeRates() 