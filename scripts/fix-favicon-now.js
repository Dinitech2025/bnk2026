const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixFavicon() {
  try {
    console.log('🔧 Correction immédiate du favicon...\n')
    
    // Utiliser votre logo existant comme favicon
    const logoUrl = 'https://res.cloudinary.com/defgsvs5i/image/upload/v1750944156/bnk/logos/fzgymmqcj4fedfvojwq1.png'
    
    console.log('🖼️  Remplacement du favicon GitHub par votre logo')
    console.log('🔗 URL:', logoUrl)
    
    // Mettre à jour le favicon
    await prisma.setting.upsert({
      where: { key: 'faviconUrl' },
      update: { value: logoUrl },
      create: { key: 'faviconUrl', value: logoUrl, type: 'string' }
    })
    
    console.log('✅ Favicon corrigé avec succès!')
    console.log('🌐 Rechargez votre page avec Ctrl+Shift+R')
    console.log('❌ Plus d\'erreur Next.js car votre logo est sur Cloudinary')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixFavicon() 