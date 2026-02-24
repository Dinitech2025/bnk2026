import { syncExchangeRates } from '../lib/currency-service'

async function syncRatesNow() {
  console.log('🔄 Synchronisation des taux de change...\n')
  
  try {
    const success = await syncExchangeRates(true) // Force la synchronisation
    
    if (success) {
      console.log('✅ Taux de change synchronisés avec succès!\n')
      
      // Vérifier les taux
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const rates = await prisma.setting.findMany({
        where: { key: { startsWith: 'exchangeRate_' } }
      })
      
      console.log(`📊 ${rates.length} taux de change configurés:\n`)
      
      const important = ['MGA', 'USD', 'EUR', 'GBP']
      rates.forEach(setting => {
        const code = setting.key.replace('exchangeRate_', '')
        if (important.includes(code)) {
          const rate = parseFloat(setting.value || '0')
          if (code === 'MGA') {
            console.log(`   ${code}: ${rate} (devise de base)`)
          } else {
            const mgaPerCurrency = rate === 0 ? 0 : 1 / rate
            console.log(`   ${code}: ${rate} (1 ${code} = ${Math.round(mgaPerCurrency)} MGA)`)
          }
        }
      })
      
      await prisma.$disconnect()
    } else {
      console.log('❌ Échec de la synchronisation')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    process.exit(1)
  }
}

syncRatesNow()


