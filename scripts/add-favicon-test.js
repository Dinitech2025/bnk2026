const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addFaviconTest() {
  try {
    console.log('🔧 Ajout d\'un favicon de test...\n')
    
    // URL de test d'un favicon réel (favicon de GitHub comme test)
    const faviconUrl = 'https://github.com/favicon.ico'
    
    // Créer ou mettre à jour le paramètre faviconUrl
    const result = await prisma.setting.upsert({
      where: {
        key: 'faviconUrl'
      },
      update: {
        value: faviconUrl
      },
      create: {
        key: 'faviconUrl',
        value: faviconUrl,
        type: 'string'
      }
    })
    
    console.log('✅ Paramètre favicon ajouté/mis à jour:', result)
    
    // Vérifier que le paramètre a été ajouté
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['faviconUrl', 'logoUrl', 'siteName', 'useSiteLogo']
        }
      }
    })
    
    console.log('\n📋 Paramètres liés aux icônes:')
    settings.forEach(setting => {
      console.log(`🔧 ${setting.key}: "${setting.value}"`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du favicon:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addFaviconTest() 