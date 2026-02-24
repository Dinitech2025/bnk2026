const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSettings() {
  try {
    console.log('Vérification des paramètres dans la base de données...\n')
    
    const settings = await prisma.setting.findMany({
      orderBy: {
        key: 'asc'
      }
    })

    if (settings.length === 0) {
      console.log('❌ Aucun paramètre trouvé dans la base de données')
      return
    }

    console.log(`✅ ${settings.length} paramètres trouvés:\n`)
    
    // Afficher tous les paramètres
    settings.forEach(setting => {
      console.log(`📝 ${setting.key}: "${setting.value || 'NULL'}"`)
    })

    // Vérifier spécifiquement les paramètres de logo
    console.log('\n🔍 Paramètres de logo spécifiques:')
    const logoSettings = settings.filter(s => 
      s.key.includes('logo') || s.key.includes('Logo') || s.key === 'useSiteLogo'
    )
    
    if (logoSettings.length === 0) {
      console.log('❌ Aucun paramètre de logo trouvé')
    } else {
      logoSettings.forEach(setting => {
        console.log(`🖼️  ${setting.key}: "${setting.value || 'NULL'}"`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des paramètres:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSettings() 
 
 
 