import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkExchangeRates() {
  console.log('🔍 Vérification de l\'état des taux de change...\n')
  
  try {
    // Récupérer la date de dernière mise à jour
    const lastUpdate = await prisma.setting.findUnique({
      where: { key: 'exchange_rates_last_update' }
    })
    
    if (lastUpdate?.value) {
      const lastUpdateDate = new Date(lastUpdate.value)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60)
      
      console.log('📅 Dernière synchronisation:')
      console.log(`   Date: ${lastUpdateDate.toLocaleString('fr-FR')}`)
      console.log(`   Il y a: ${hoursSinceUpdate.toFixed(1)} heures`)
      console.log(`   Statut: ${hoursSinceUpdate < 5 ? '✅ À jour' : '⚠️  Nécessite une mise à jour'}\n`)
    } else {
      console.log('⚠️  Aucune synchronisation trouvée dans la base de données\n')
    }
    
    // Récupérer tous les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'exchangeRate_' }
      }
    })
    
    console.log(`💱 Taux de change configurés (${exchangeRateSettings.length} devises):\n`)
    
    const importantCurrencies = ['MGA', 'USD', 'EUR', 'GBP']
    const otherCurrencies: { key: string; value: string }[] = []
    
    exchangeRateSettings.forEach((setting) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      if (importantCurrencies.includes(currencyCode)) {
        const rate = parseFloat(setting.value || '0')
        if (currencyCode === 'MGA') {
          console.log(`   ${currencyCode}: ${rate} (devise de base)`)
        } else {
          // Convertir pour afficher: 1 USD = X MGA
          const mgaPerCurrency = rate === 0 ? 0 : 1 / rate
          console.log(`   ${currencyCode}: ${rate} (1 ${currencyCode} = ${Math.round(mgaPerCurrency)} MGA)`)
        }
      } else {
        otherCurrencies.push({ key: currencyCode, value: setting.value || '0' })
      }
    })
    
    if (otherCurrencies.length > 0) {
      console.log(`\n   Autres devises (${otherCurrencies.length}):`)
      otherCurrencies.slice(0, 10).forEach(({ key, value }) => {
        const rate = parseFloat(value)
        const mgaPerCurrency = rate === 0 ? 0 : 1 / rate
        console.log(`   ${key}: ${rate} (1 ${key} = ${Math.round(mgaPerCurrency)} MGA)`)
      })
      if (otherCurrencies.length > 10) {
        console.log(`   ... et ${otherCurrencies.length - 10} autres`)
      }
    }
    
    // Vérifier si les taux critiques sont présents
    const missingCurrencies: string[] = []
    if (!exchangeRateSettings.find(s => s.key === 'exchangeRate_MGA')) missingCurrencies.push('MGA')
    if (!exchangeRateSettings.find(s => s.key === 'exchangeRate_USD')) missingCurrencies.push('USD')
    if (!exchangeRateSettings.find(s => s.key === 'exchangeRate_EUR')) missingCurrencies.push('EUR')
    if (!exchangeRateSettings.find(s => s.key === 'exchangeRate_GBP')) missingCurrencies.push('GBP')
    
    if (missingCurrencies.length > 0) {
      console.log(`\n❌ Devises manquantes: ${missingCurrencies.join(', ')}`)
      console.log('\n💡 Pour synchroniser les taux de change:')
      console.log('   - Appeler GET /api/admin/settings/currency/sync?force=true')
      console.log('   - Ou exécuter: npm run sync-rates')
    } else {
      console.log('\n✅ Toutes les devises critiques sont configurées')
    }
    
    // Test de calcul
    console.log('\n🧮 Test de calcul:')
    const usdRate = exchangeRateSettings.find(s => s.key === 'exchangeRate_USD')?.value
    const eurRate = exchangeRateSettings.find(s => s.key === 'exchangeRate_EUR')?.value
    
    if (usdRate) {
      const rate = parseFloat(usdRate)
      const testAmount = 216 // USD
      const mgaAmount = rate === 0 ? 0 : testAmount / rate
      console.log(`   ${testAmount} USD = ${Math.round(mgaAmount)} MGA`)
    }
    
    if (eurRate) {
      const rate = parseFloat(eurRate)
      const testAmount = 100 // EUR
      const mgaAmount = rate === 0 ? 0 : testAmount / rate
      console.log(`   ${testAmount} EUR = ${Math.round(mgaAmount)} MGA`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkExchangeRates()


