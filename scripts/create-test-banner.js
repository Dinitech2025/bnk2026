const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestBanner() {
  try {
    console.log('🎨 Création d\'une bannière de test avec couleurs visibles...')
    
    const banner = await prisma.heroBanner.create({
      data: {
        title: "Bienvenue chez",
        subtitle: "Boutik'nakà",
        description: "Découvrez nos produits et services de qualité exceptionnelle",
        backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        primaryButtonText: "Explorer nos Produits",
        primaryButtonLink: "/products",
        secondaryButtonText: "Découvrir nos Services", 
        secondaryButtonLink: "/services",
        titleColor: "#ff0000",        // Rouge vif pour le titre
        subtitleColor: "#00ff00",     // Vert vif pour le sous-titre  
        descriptionColor: "#0000ff",  // Bleu vif pour la description
        primaryButtonColor: "#ffffff",
        primaryButtonBg: "#ff6600",   // Orange vif pour le bouton principal
        secondaryButtonColor: "#000000",
        secondaryButtonBg: "#ffff00", // Jaune vif pour le bouton secondaire
        secondaryButtonBorder: "#ff00ff", // Magenta pour la bordure
        backgroundBlur: 3,            // Flou léger
        backgroundOpacity: 70,        // Opacité élevée pour voir les couleurs
        isActive: true
      }
    })
    
    console.log('✅ Bannière de test créée:', banner.id)
    console.log('🌈 Couleurs de test très visibles:')
    console.log('   - Titre: ROUGE VIF (#ff0000)')
    console.log('   - Sous-titre: VERT VIF (#00ff00)')
    console.log('   - Description: BLEU VIF (#0000ff)')
    console.log('   - Bouton 1: ORANGE VIF sur blanc (#ff6600)')
    console.log('   - Bouton 2: JAUNE VIF avec bordure magenta')
    console.log('   - Flou: 3px')
    console.log('   - Opacité: 70%')
    console.log('')
    console.log('🔗 Allez sur http://localhost:3000 maintenant!')
    console.log('🎯 Vous devriez voir des couleurs TRÈS visibles si ça marche!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestBanner()
