const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addThresholdSettings() {
  console.log('🔧 Ajout des seuils de commission dynamiques...')
  
  const thresholdSettings = [
    {
      key: 'commission_threshold_1',
      value: '10',
      description: 'Seuil 1 pour commission (en EUR)',
      category: 'commission'
    },
    {
      key: 'commission_threshold_2', 
      value: '25',
      description: 'Seuil 2 pour commission (en EUR)',
      category: 'commission'
    },
    {
      key: 'commission_threshold_3',
      value: '100', 
      description: 'Seuil 3 pour commission (en EUR)',
      category: 'commission'
    },
    {
      key: 'commission_threshold_4',
      value: '200',
      description: 'Seuil 4 pour commission (en EUR)', 
      category: 'commission'
    }
  ]
  
  for (const setting of thresholdSettings) {
    await prisma.importCalculationSettings.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    })
    console.log('✅', setting.key, ':', setting.value, setting.description)
  }
  
  console.log('🎉 Seuils de commission ajoutés avec succès !')
  await prisma.$disconnect()
}

addThresholdSettings().catch(console.error) 

const prisma = new PrismaClient()

async function addThresholdSettings() {
  console.log('🔧 Ajout des seuils de commission dynamiques...')
  
  const thresholdSettings = [
    {
      key: 'commission_threshold_1',
      value: '10',
      description: 'Seuil 1 pour commission (en EUR)',
      category: 'commission'
    },
    {
      key: 'commission_threshold_2', 
      value: '25',
      description: 'Seuil 2 pour commission (en EUR)',
      category: 'commission'
    },
    {
      key: 'commission_threshold_3',
      value: '100', 
      description: 'Seuil 3 pour commission (en EUR)',
      category: 'commission'
    },
    {
      key: 'commission_threshold_4',
      value: '200',
      description: 'Seuil 4 pour commission (en EUR)', 
      category: 'commission'
    }
  ]
  
  for (const setting of thresholdSettings) {
    await prisma.importCalculationSettings.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    })
    console.log('✅', setting.key, ':', setting.value, setting.description)
  }
  
  console.log('🎉 Seuils de commission ajoutés avec succès !')
  await prisma.$disconnect()
}

addThresholdSettings().catch(console.error) 