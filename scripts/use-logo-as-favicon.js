const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function useLogoAsFavicon() {
  try {
    console.log('🔧 Utilisation du logo comme favicon...\n')
    
    // Récupérer l'URL du logo actuel
    const logoSetting = await prisma.setting.findUnique({
      where: { key: 'logoUrl' }
    })
    
    if (!logoSetting || !logoSetting.value) {
      console.log('❌ Aucun logo trouvé dans les paramètres')
      console.log('Veuillez d\'abord uploader un logo dans les paramètres d\'apparence')
      return
    }
    
    const logoUrl = logoSetting.value
    console.log('🖼️  Logo trouvé:', logoUrl)
    
    // Utiliser l'URL du logo comme favicon
    const result = await prisma.setting.upsert({
      where: {
        key: 'faviconUrl'
      },
      update: {
        value: logoUrl
      },
      create: {
        key: 'faviconUrl',
        value: logoUrl,
        type: 'string'
      }
    })
    
    console.log('✅ Favicon mis à jour avec le logo!')
    console.log('🔗 URL du favicon:', logoUrl)
    
    // Vérifier les paramètres mis à jour
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['faviconUrl', 'logoUrl', 'siteName', 'useSiteLogo']
        }
      }
    })
    
    console.log('\n📋 Paramètres actuels :')
    settings.forEach(setting => {
      console.log(`🔧 ${setting.key}: "${setting.value}"`)
    })
    
    console.log('\n🌐 Pour voir le changement :')
    console.log('1. Allez sur http://localhost:3000')
    console.log('2. Le favicon devrait maintenant être votre logo')
    console.log('3. Rechargez avec Ctrl+Shift+R si nécessaire')
    console.log('4. Page de debug : http://localhost:3000/debug/settings')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await prisma.$disconnect()
  }
}

useLogoAsFavicon() 