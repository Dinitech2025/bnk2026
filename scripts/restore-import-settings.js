const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreImportSettings() {
  console.log('🔧 Restauration des paramètres de calcul d\'importation...')

  try {
    // Supprimer les paramètres existants
    await prisma.importCalculationSettings.deleteMany({})
    console.log('✅ Anciens paramètres supprimés')

    // Paramètres par défaut
    const defaultSettings = [
      // Transport rates (par kg)
      {
        key: 'transport_france_rate',
        value: '15',
        description: 'Tarif transport France (par kg)',
        category: 'transport'
      },
      {
        key: 'transport_usa_rate',
        value: '35',
        description: 'Tarif transport USA (par kg)',
        category: 'transport'
      },
      {
        key: 'transport_uk_rate',
        value: '18',
        description: 'Tarif transport UK (par kg)',
        category: 'transport'
      },
      {
        key: 'transport_china_rate',
        value: '25',
        description: 'Tarif transport Chine (par kg)',
        category: 'transport'
      },

      // Commission rates (pourcentages selon tranches de prix)
      {
        key: 'commission_0_10',
        value: '25',
        description: 'Commission pour prix < 10 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_10_25',
        value: '35',
        description: 'Commission pour prix 10-25 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_25_100',
        value: '38',
        description: 'Commission pour prix 25-100 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_100_200',
        value: '30',
        description: 'Commission pour prix 100-200 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_200_plus',
        value: '25',
        description: 'Commission pour prix > 200 (en %)',
        category: 'commission'
      },

      // Frais fixes
      {
        key: 'processing_fee',
        value: '2',
        description: 'Frais de traitement fixes',
        category: 'fees'
      },
      {
        key: 'tax_rate',
        value: '3.5',
        description: 'Taux de taxe (en %)',
        category: 'fees'
      },

      // Paramètres généraux
      {
        key: 'calculation_method',
        value: 'hybrid',
        description: 'Méthode de calcul (hybrid, original, detailed)',
        category: 'general'
      }
    ]

    // Créer tous les paramètres
    await prisma.importCalculationSettings.createMany({
      data: defaultSettings
    })

    console.log(`✅ ${defaultSettings.length} paramètres restaurés`)

    // Afficher les paramètres par catégorie
    const categories = ['transport', 'commission', 'fees', 'general']
    for (const category of categories) {
      const categorySettings = defaultSettings.filter(s => s.category === category)
      console.log(`\n📂 ${category.toUpperCase()}:`)
      categorySettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value} (${setting.description})`)
      })
    }

    console.log('\n🎉 Paramètres de calcul d\'importation restaurés avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreImportSettings() 

const prisma = new PrismaClient()

async function restoreImportSettings() {
  console.log('🔧 Restauration des paramètres de calcul d\'importation...')

  try {
    // Supprimer les paramètres existants
    await prisma.importCalculationSettings.deleteMany({})
    console.log('✅ Anciens paramètres supprimés')

    // Paramètres par défaut
    const defaultSettings = [
      // Transport rates (par kg)
      {
        key: 'transport_france_rate',
        value: '15',
        description: 'Tarif transport France (par kg)',
        category: 'transport'
      },
      {
        key: 'transport_usa_rate',
        value: '35',
        description: 'Tarif transport USA (par kg)',
        category: 'transport'
      },
      {
        key: 'transport_uk_rate',
        value: '18',
        description: 'Tarif transport UK (par kg)',
        category: 'transport'
      },
      {
        key: 'transport_china_rate',
        value: '25',
        description: 'Tarif transport Chine (par kg)',
        category: 'transport'
      },

      // Commission rates (pourcentages selon tranches de prix)
      {
        key: 'commission_0_10',
        value: '25',
        description: 'Commission pour prix < 10 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_10_25',
        value: '35',
        description: 'Commission pour prix 10-25 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_25_100',
        value: '38',
        description: 'Commission pour prix 25-100 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_100_200',
        value: '30',
        description: 'Commission pour prix 100-200 (en %)',
        category: 'commission'
      },
      {
        key: 'commission_200_plus',
        value: '25',
        description: 'Commission pour prix > 200 (en %)',
        category: 'commission'
      },

      // Frais fixes
      {
        key: 'processing_fee',
        value: '2',
        description: 'Frais de traitement fixes',
        category: 'fees'
      },
      {
        key: 'tax_rate',
        value: '3.5',
        description: 'Taux de taxe (en %)',
        category: 'fees'
      },

      // Paramètres généraux
      {
        key: 'calculation_method',
        value: 'hybrid',
        description: 'Méthode de calcul (hybrid, original, detailed)',
        category: 'general'
      }
    ]

    // Créer tous les paramètres
    await prisma.importCalculationSettings.createMany({
      data: defaultSettings
    })

    console.log(`✅ ${defaultSettings.length} paramètres restaurés`)

    // Afficher les paramètres par catégorie
    const categories = ['transport', 'commission', 'fees', 'general']
    for (const category of categories) {
      const categorySettings = defaultSettings.filter(s => s.category === category)
      console.log(`\n📂 ${category.toUpperCase()}:`)
      categorySettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value} (${setting.description})`)
      })
    }

    console.log('\n🎉 Paramètres de calcul d\'importation restaurés avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreImportSettings() 