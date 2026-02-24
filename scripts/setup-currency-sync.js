const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupCurrencySync() {
  console.log('⚙️ Configuration de la synchronisation des taux de change...')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier la configuration actuelle
    console.log('\n1️⃣ Vérification de la configuration actuelle...')
    
    const lastUpdate = await prisma.setting.findUnique({
      where: { key: 'exchange_rates_last_update' }
    })
    
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    
    console.log(`📅 Dernière mise à jour: ${lastUpdate?.value ? new Date(lastUpdate.value).toLocaleString('fr-FR') : 'Jamais'}`)
    console.log(`💱 Nombre de devises: ${exchangeRates.length}`)

    // 2. Vérifier les devises importantes
    console.log('\n2️⃣ Vérification des devises importantes...')
    
    const importantCurrencies = ['MGA', 'EUR', 'USD', 'GBP', 'CHF']
    
    for (const currency of importantCurrencies) {
      const exists = await prisma.setting.findUnique({
        where: { key: `exchangeRate_${currency}` }
      })
      
      if (exists) {
        const rate = parseFloat(exists.value)
        if (currency === 'MGA') {
          console.log(`✅ ${currency}: ${rate} (devise de base)`)
        } else {
          console.log(`✅ ${currency}: ${Math.round(rate)} MGA`)
        }
      } else {
        console.log(`❌ ${currency}: Manquant`)
      }
    }

    // 3. Instructions d'utilisation
    console.log('\n3️⃣ Instructions d\'utilisation:')
    console.log('\n📋 Commandes disponibles:')
    console.log('   • Synchronisation manuelle: node scripts/sync-exchange-rates.js')
    console.log('   • Via l\'interface admin: http://localhost:3000/admin/settings/currency')
    console.log('   • Via l\'API: GET /api/admin/settings/currency/sync')
    
    console.log('\n🔄 Synchronisation automatique:')
    console.log('   • Intervalle: Toutes les 4.8 heures (max 5 fois/jour)')
    console.log('   • Devise de base: MGA (Ariary Malgache)')
    console.log('   • Source: fxratesapi.com')
    
    console.log('\n💡 Devises supportées pour l\'importation:')
    const currencyNames = {
      'MGA': 'Ariary Malgache (devise de base)',
      'EUR': 'Euro (France)',
      'USD': 'Dollar US (États-Unis)',
      'GBP': 'Livre Sterling (Royaume-Uni)',
      'CHF': 'Franc Suisse'
    }
    
    importantCurrencies.forEach(currency => {
      console.log(`   • ${currency}: ${currencyNames[currency]}`)
    })

    console.log('\n🎯 Intégration avec le simulateur d\'importation:')
    console.log('   • Les taux sont automatiquement utilisés dans les calculs')
    console.log('   • Conversion automatique vers MGA pour l\'affichage')
    console.log('   • Mise à jour en temps réel lors de la synchronisation')

    console.log('\n✅ Configuration terminée avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupCurrencySync() 

const prisma = new PrismaClient()

async function setupCurrencySync() {
  console.log('⚙️ Configuration de la synchronisation des taux de change...')
  console.log('=' .repeat(60))

  try {
    // 1. Vérifier la configuration actuelle
    console.log('\n1️⃣ Vérification de la configuration actuelle...')
    
    const lastUpdate = await prisma.setting.findUnique({
      where: { key: 'exchange_rates_last_update' }
    })
    
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    
    console.log(`📅 Dernière mise à jour: ${lastUpdate?.value ? new Date(lastUpdate.value).toLocaleString('fr-FR') : 'Jamais'}`)
    console.log(`💱 Nombre de devises: ${exchangeRates.length}`)

    // 2. Vérifier les devises importantes
    console.log('\n2️⃣ Vérification des devises importantes...')
    
    const importantCurrencies = ['MGA', 'EUR', 'USD', 'GBP', 'CHF']
    
    for (const currency of importantCurrencies) {
      const exists = await prisma.setting.findUnique({
        where: { key: `exchangeRate_${currency}` }
      })
      
      if (exists) {
        const rate = parseFloat(exists.value)
        if (currency === 'MGA') {
          console.log(`✅ ${currency}: ${rate} (devise de base)`)
        } else {
          console.log(`✅ ${currency}: ${Math.round(rate)} MGA`)
        }
      } else {
        console.log(`❌ ${currency}: Manquant`)
      }
    }

    // 3. Instructions d'utilisation
    console.log('\n3️⃣ Instructions d\'utilisation:')
    console.log('\n📋 Commandes disponibles:')
    console.log('   • Synchronisation manuelle: node scripts/sync-exchange-rates.js')
    console.log('   • Via l\'interface admin: http://localhost:3000/admin/settings/currency')
    console.log('   • Via l\'API: GET /api/admin/settings/currency/sync')
    
    console.log('\n🔄 Synchronisation automatique:')
    console.log('   • Intervalle: Toutes les 4.8 heures (max 5 fois/jour)')
    console.log('   • Devise de base: MGA (Ariary Malgache)')
    console.log('   • Source: fxratesapi.com')
    
    console.log('\n💡 Devises supportées pour l\'importation:')
    const currencyNames = {
      'MGA': 'Ariary Malgache (devise de base)',
      'EUR': 'Euro (France)',
      'USD': 'Dollar US (États-Unis)',
      'GBP': 'Livre Sterling (Royaume-Uni)',
      'CHF': 'Franc Suisse'
    }
    
    importantCurrencies.forEach(currency => {
      console.log(`   • ${currency}: ${currencyNames[currency]}`)
    })

    console.log('\n🎯 Intégration avec le simulateur d\'importation:')
    console.log('   • Les taux sont automatiquement utilisés dans les calculs')
    console.log('   • Conversion automatique vers MGA pour l\'affichage')
    console.log('   • Mise à jour en temps réel lors de la synchronisation')

    console.log('\n✅ Configuration terminée avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupCurrencySync() 