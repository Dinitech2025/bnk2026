const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreNormalBanner() {
  try {
    console.log('🎨 Restauration des couleurs normales de la bannière...')
    
    // Trouver la bannière de test et la désactiver
    await prisma.heroBanner.updateMany({
      where: { titleColor: "#ff0000" }, // Rouge = bannière de test
      data: { isActive: false }
    })
    
    // Créer une nouvelle bannière avec des couleurs normales
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
        titleColor: "#ffffff",           // Blanc pour le titre
        subtitleColor: "#fde047",        // Jaune doré pour le sous-titre  
        descriptionColor: "#ffffff",     // Blanc pour la description
        primaryButtonColor: "#ffffff",   // Texte blanc
        primaryButtonBg: "#3b82f6",      // Bleu pour le bouton principal
        secondaryButtonColor: "#ffffff", // Texte blanc
        secondaryButtonBg: "transparent", // Fond transparent
        secondaryButtonBorder: "#ffffff", // Bordure blanche
        backgroundBlur: 0,               // Pas de flou
        backgroundOpacity: 40,           // Opacité normale
        isActive: true
      }
    })
    
    console.log('✅ Bannière normale restaurée:', banner.id)
    console.log('🎨 Couleurs normales appliquées:')
    console.log('   - Titre: Blanc (#ffffff)')
    console.log('   - Sous-titre: Jaune doré (#fde047)')
    console.log('   - Description: Blanc (#ffffff)')
    console.log('   - Bouton 1: Bleu (#3b82f6) avec texte blanc')
    console.log('   - Bouton 2: Transparent avec bordure blanche')
    console.log('   - Flou: Aucun')
    console.log('   - Opacité: 40%')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreNormalBanner()
