const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setFaviconToLogo() {
  try {
    // URL de votre logo actuel
    const logoUrl = 'https://res.cloudinary.com/defgsvs5i/image/upload/v1750944156/bnk/logos/fzgymmqcj4fedfvojwq1.png'
    
    console.log('🔧 Mise à jour du favicon avec votre logo...')
    console.log('🖼️  URL du logo:', logoUrl)
    
    // Mettre à jour le favicon avec votre logo
    await prisma.setting.upsert({
      where: { key: 'faviconUrl' },
      update: { value: logoUrl },
      create: { key: 'faviconUrl', value: logoUrl, type: 'string' }
    })
    
    console.log('✅ Favicon mis à jour avec succès!')
    console.log('🌐 Allez sur http://localhost:3000 et rechargez avec Ctrl+Shift+R')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setFaviconToLogo() 