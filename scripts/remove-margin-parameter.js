const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeMarginParameter() {
  console.log('🗑️ SUPPRESSION DU PARAMÈTRE DE MARGE')
  console.log('=' .repeat(50))
  
  try {
    // Supprimer le paramètre margin_rate
    const deleted = await prisma.importCalculationSettings.deleteMany({
      where: {
        key: 'margin_rate'
      }
    })
    
    if (deleted.count > 0) {
      console.log('✅ Paramètre margin_rate supprimé avec succès')
      console.log(`   ${deleted.count} enregistrement(s) supprimé(s)`)
    } else {
      console.log('ℹ️ Aucun paramètre margin_rate trouvé')
    }
    
    // Vérifier que le paramètre a bien été supprimé
    const remaining = await prisma.importCalculationSettings.findMany({
      where: {
        key: 'margin_rate'
      }
    })
    
    if (remaining.length === 0) {
      console.log('✅ Vérification : paramètre margin_rate bien supprimé')
    } else {
      console.log('⚠️ Attention : des paramètres margin_rate existent encore')
    }
    
    // Afficher les paramètres restants
    console.log('\n📋 Paramètres restants dans le système :')
    const allSettings = await prisma.importCalculationSettings.findMany({
      orderBy: { category: 'asc' }
    })
    
    const categories = {}
    allSettings.forEach(setting => {
      if (!categories[setting.category]) {
        categories[setting.category] = []
      }
      categories[setting.category].push(setting)
    })
    
    Object.entries(categories).forEach(([category, settings]) => {
      console.log(`\n   ${category.toUpperCase()} :`)
      settings.forEach(setting => {
        console.log(`     ${setting.key}: ${setting.value} (${setting.description})`)
      })
    })
    
    console.log('\n🎉 Suppression terminée avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeMarginParameter() 

const prisma = new PrismaClient()

async function removeMarginParameter() {
  console.log('🗑️ SUPPRESSION DU PARAMÈTRE DE MARGE')
  console.log('=' .repeat(50))
  
  try {
    // Supprimer le paramètre margin_rate
    const deleted = await prisma.importCalculationSettings.deleteMany({
      where: {
        key: 'margin_rate'
      }
    })
    
    if (deleted.count > 0) {
      console.log('✅ Paramètre margin_rate supprimé avec succès')
      console.log(`   ${deleted.count} enregistrement(s) supprimé(s)`)
    } else {
      console.log('ℹ️ Aucun paramètre margin_rate trouvé')
    }
    
    // Vérifier que le paramètre a bien été supprimé
    const remaining = await prisma.importCalculationSettings.findMany({
      where: {
        key: 'margin_rate'
      }
    })
    
    if (remaining.length === 0) {
      console.log('✅ Vérification : paramètre margin_rate bien supprimé')
    } else {
      console.log('⚠️ Attention : des paramètres margin_rate existent encore')
    }
    
    // Afficher les paramètres restants
    console.log('\n📋 Paramètres restants dans le système :')
    const allSettings = await prisma.importCalculationSettings.findMany({
      orderBy: { category: 'asc' }
    })
    
    const categories = {}
    allSettings.forEach(setting => {
      if (!categories[setting.category]) {
        categories[setting.category] = []
      }
      categories[setting.category].push(setting)
    })
    
    Object.entries(categories).forEach(([category, settings]) => {
      console.log(`\n   ${category.toUpperCase()} :`)
      settings.forEach(setting => {
        console.log(`     ${setting.key}: ${setting.value} (${setting.description})`)
      })
    })
    
    console.log('\n🎉 Suppression terminée avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeMarginParameter() 