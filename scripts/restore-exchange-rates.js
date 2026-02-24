const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreExchangeRates() {
  console.log('💱 Restauration des taux de change...')

  try {
    // Supprimer les anciens taux de change
    await prisma.setting.deleteMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    console.log('✅ Anciens taux de change supprimés')

    // Taux de change par défaut (MGA comme devise de base)
    const exchangeRates = [
      {
        key: 'exchangeRate_MGA',
        value: '1.0',
        type: 'NUMBER'
      },
      {
        key: 'exchangeRate_EUR',
        value: '5100.0',
        type: 'NUMBER'
      },
      {
        key: 'exchangeRate_USD',
        value: '4680.0',
        type: 'NUMBER'
      },
      {
        key: 'exchangeRate_GBP',
        value: '5950.0',
        type: 'NUMBER'
      }
    ]

    // Créer les nouveaux taux
    await prisma.setting.createMany({
      data: exchangeRates
    })

    console.log(`✅ ${exchangeRates.length} taux de change restaurés`)

    // Afficher les taux
    console.log('\n💱 Taux de change (1 devise = X MGA):')
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      console.log(`   ${currency}: ${rate.value} MGA`)
    })

    console.log('\n🎉 Taux de change restaurés avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la restauration des taux:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreExchangeRates() 

const prisma = new PrismaClient()

async function restoreExchangeRates() {
  console.log('💱 Restauration des taux de change...')

  try {
    // Supprimer les anciens taux de change
    await prisma.setting.deleteMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })
    console.log('✅ Anciens taux de change supprimés')

    // Taux de change par défaut (MGA comme devise de base)
    const exchangeRates = [
      {
        key: 'exchangeRate_MGA',
        value: '1.0',
        type: 'NUMBER'
      },
      {
        key: 'exchangeRate_EUR',
        value: '5100.0',
        type: 'NUMBER'
      },
      {
        key: 'exchangeRate_USD',
        value: '4680.0',
        type: 'NUMBER'
      },
      {
        key: 'exchangeRate_GBP',
        value: '5950.0',
        type: 'NUMBER'
      }
    ]

    // Créer les nouveaux taux
    await prisma.setting.createMany({
      data: exchangeRates
    })

    console.log(`✅ ${exchangeRates.length} taux de change restaurés`)

    // Afficher les taux
    console.log('\n💱 Taux de change (1 devise = X MGA):')
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      console.log(`   ${currency}: ${rate.value} MGA`)
    })

    console.log('\n🎉 Taux de change restaurés avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la restauration des taux:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreExchangeRates() 