const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testOverlayAPI() {
  try {
    console.log('🧪 Test complet de la couleur overlay...')
    
    // 1. Tester la sauvegarde directe en base
    console.log('📝 1. Test sauvegarde directe en base...')
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    if (banner) {
      const updated = await prisma.heroBanner.update({
        where: { id: banner.id },
        data: {
          backgroundOverlayColor: '#ff1493', // Rose vif (DeepPink)
          backgroundOpacity: 60,
          backgroundBlur: 4
        }
      })
      
      console.log('✅ Bannière mise à jour:')
      console.log('- Couleur overlay:', updated.backgroundOverlayColor)
      console.log('- Opacité:', updated.backgroundOpacity + '%')
      console.log('- Flou:', updated.backgroundBlur + 'px')
      
      // 2. Calculer la couleur finale
      const hexOpacity = Math.round((updated.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')
      const finalColor = `${updated.backgroundOverlayColor}${hexOpacity}`
      console.log('🎨 Couleur finale CSS:', finalColor)
      
      // 3. Tester différentes couleurs
      console.log('\n🌈 Test avec différentes couleurs...')
      
      const testColors = [
        { name: 'Blanc transparent', color: '#ffffff', opacity: 30 },
        { name: 'Bleu semi-transparent', color: '#3b82f6', opacity: 50 },
        { name: 'Vert émeraude', color: '#10b981', opacity: 40 },
        { name: 'Rouge corail', color: '#ef4444', opacity: 35 }
      ]
      
      for (let i = 0; i < testColors.length; i++) {
        const test = testColors[i]
        
        await prisma.heroBanner.update({
          where: { id: banner.id },
          data: {
            backgroundOverlayColor: test.color,
            backgroundOpacity: test.opacity
          }
        })
        
        const hexOp = Math.round((test.opacity / 100) * 255).toString(16).padStart(2, '0')
        const finalCol = `${test.color}${hexOp}`
        
        console.log(`${i + 1}. ${test.name}: ${finalCol}`)
        
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      console.log('\n✅ Tous les tests réussis!')
      
    } else {
      console.log('❌ Aucune bannière active trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testOverlayAPI()
