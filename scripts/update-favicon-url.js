const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateFaviconUrl() {
  try {
    console.log('🔧 Mise à jour du favicon avec votre URL...\n')
    
    // REMPLACEZ CETTE URL PAR VOTRE FAVICON RÉEL
    // Exemples d'URLs possibles :
    // - Si vous avez uploadé un favicon : 'https://res.cloudinary.com/defgsvs5i/raw/upload/v1234567890/bnk/favicons/votre-favicon.ico'
    // - Si vous voulez utiliser votre logo comme favicon : utilisez l'URL de logoUrl
    // - Si vous avez un favicon local : '/favicon.ico'
    
    const faviconUrl = 'REMPLACEZ_PAR_VOTRE_URL_FAVICON'
    
    if (faviconUrl === 'REMPLACEZ_PAR_VOTRE_URL_FAVICON') {
      console.log('❌ Veuillez modifier le script et remplacer REMPLACEZ_PAR_VOTRE_URL_FAVICON par votre URL réelle')
      console.log('\nExemples d\'URLs :')
      console.log('- Favicon uploadé : https://res.cloudinary.com/defgsvs5i/raw/upload/v1234567890/bnk/favicons/mon-favicon.ico')
      console.log('- Utiliser le logo : https://res.cloudinary.com/defgsvs5i/image/upload/v1750944156/bnk/logos/fzgymmqcj4fedfvojwq1.png')
      console.log('- Favicon local : /favicon.ico')
      return
    }
    
    // Mettre à jour le paramètre faviconUrl
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
    
    console.log('✅ Favicon mis à jour avec succès!')
    console.log('🔗 Nouvelle URL:', faviconUrl)
    
    // Vérifier les paramètres mis à jour
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['faviconUrl', 'logoUrl', 'siteName']
        }
      }
    })
    
    console.log('\n📋 Paramètres actuels :')
    settings.forEach(setting => {
      console.log(`🔧 ${setting.key}: "${setting.value}"`)
    })
    
    console.log('\n🌐 Pour voir le changement :')
    console.log('1. Allez sur http://localhost:3000')
    console.log('2. Rechargez la page avec Ctrl+Shift+R')
    console.log('3. Ou utilisez la page de debug : http://localhost:3000/debug/settings')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du favicon:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateFaviconUrl() 