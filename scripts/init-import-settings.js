const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initImportSettings() {
  console.log('🚀 Initialisation des paramètres de calcul d\'importation...')

  // Paramètres de transport (EUR par kg)
  const transportSettings = [
    { key: 'transport_france_rate', value: '15', description: 'Taux transport France (EUR/kg)', category: 'transport' },
    { key: 'transport_usa_rate', value: '35', description: 'Taux transport USA (EUR/kg)', category: 'transport' },
    { key: 'transport_uk_rate', value: '18', description: 'Taux transport UK (EUR/kg)', category: 'transport' },
    { key: 'transport_china_rate', value: '25', description: 'Taux transport Chine (EUR/kg)', category: 'transport' }
  ]

  // Paramètres de commission (%)
  const commissionSettings = [
    { key: 'commission_0_10', value: '25', description: 'Commission 0-10 EUR (%)', category: 'commission' },
    { key: 'commission_10_25', value: '35', description: 'Commission 10-25 EUR (%)', category: 'commission' },
    { key: 'commission_25_100', value: '38', description: 'Commission 25-100 EUR (%)', category: 'commission' },
    { key: 'commission_100_200', value: '30', description: 'Commission 100-200 EUR (%)', category: 'commission' },
    { key: 'commission_200_plus', value: '25', description: 'Commission 200+ EUR (%)', category: 'commission' }
  ]

  // Frais et taxes
  const feeSettings = [
    { key: 'processing_fee', value: '2', description: 'Frais de traitement (EUR)', category: 'fees' },
    { key: 'tax_rate', value: '3.5', description: 'Taux de taxe (%)', category: 'fees' }
  ]

  const allSettings = [...transportSettings, ...commissionSettings, ...feeSettings]

  for (const setting of allSettings) {
    try {
      await prisma.importCalculationSettings.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
          category: setting.category
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category
        }
      })
      console.log(`✅ ${setting.key}: ${setting.value}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${setting.key}:`, error)
    }
  }

  // Initialiser les taux de change de base
  const exchangeRates = [
    { key: 'exchangeRate_USD', value: '4600' }, // 1 USD = 4600 MGA
    { key: 'exchangeRate_EUR', value: '5100' }, // 1 EUR = 5100 MGA
    { key: 'exchangeRate_GBP', value: '5800' }, // 1 GBP = 5800 MGA
    { key: 'exchangeRate_MGA', value: '1' }     // 1 MGA = 1 MGA
  ]

  for (const rate of exchangeRates) {
    try {
      await prisma.setting.upsert({
        where: { key: rate.key },
        update: { value: rate.value },
        create: { key: rate.key, value: rate.value }
      })
      console.log(`💱 ${rate.key}: ${rate.value}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${rate.key}:`, error)
    }
  }

  console.log('🎉 Initialisation terminée !')
}

initImportSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 