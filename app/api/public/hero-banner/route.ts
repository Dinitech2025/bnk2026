import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 GET /api/public/hero-banner - Récupération bannière publique...')
    
    await prisma.$connect()
    
    // Désactiver toutes les bannières sauf la plus récente
    const allActiveBanners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (allActiveBanners.length > 1) {
      console.log('🔧 Désactivation des anciennes bannières...')
      const oldBannerIds = allActiveBanners.slice(1).map(b => b.id)
      await prisma.heroBanner.updateMany({
        where: { id: { in: oldBannerIds } },
        data: { isActive: false }
      })
      console.log('✅ Anciennes bannières désactivées:', oldBannerIds.length)
    }

    const heroBanner = await prisma.heroBanner.findFirst({
      where: { isActive: true },
      include: {
        backgroundImages: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('📊 Bannière publique trouvée:', heroBanner?.id || 'Aucune')
    if (heroBanner) {
      console.log('🎨 Couleurs bannière:', {
        titre: heroBanner.titleColor,
        sousTitre: heroBanner.subtitleColor,
        flou: heroBanner.backgroundBlur
      })
    }

    if (!heroBanner) {
      // Retourner une bannière par défaut si aucune n'existe
      const defaultBanner = {
        title: "Bienvenue chez",
        subtitle: "Boutik'nakà",
        description: "Découvrez nos produits et services de qualité exceptionnelle",
        backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        primaryButtonText: "Explorer nos Produits",
        primaryButtonLink: "/products",
        secondaryButtonText: "Découvrir nos Services",
        secondaryButtonLink: "/services",
        titleColor: "#ffffff",
        subtitleColor: "#fde047",
        descriptionColor: "#ffffff",
        primaryButtonColor: "#ffffff",
        primaryButtonBg: "#3b82f6",
        secondaryButtonColor: "#ffffff",
        secondaryButtonBg: "transparent",
        secondaryButtonBorder: "#ffffff",
        backgroundBlur: 0,
        backgroundOpacity: 40,
        backgroundOverlayColor: "#000000",
        backgroundSlideshowEnabled: false,
        backgroundSlideshowDuration: 5000,
        backgroundSlideshowTransition: "fade",
        backgroundImages: []
      }
      console.log('📝 Utilisation de la bannière par défaut')
      return NextResponse.json(defaultBanner)
    }

    return NextResponse.json(heroBanner)
  } catch (error) {
    console.error('❌ Erreur GET public hero-banner:', error)
    
    // En cas d'erreur, retourner une bannière par défaut
    const defaultBanner = {
      title: "Bienvenue chez",
      subtitle: "Boutik'nakà", 
      description: "Découvrez nos produits et services de qualité exceptionnelle",
      backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      primaryButtonText: "Explorer nos Produits",
      primaryButtonLink: "/products",
      secondaryButtonText: "Découvrir nos Services",
      secondaryButtonLink: "/services",
      titleColor: "#ffffff",
      subtitleColor: "#fde047",
      descriptionColor: "#ffffff",
      primaryButtonColor: "#ffffff",
      primaryButtonBg: "#3b82f6",
      secondaryButtonColor: "#ffffff",
      secondaryButtonBg: "transparent",
      secondaryButtonBorder: "#ffffff",
      backgroundBlur: 0,
      backgroundOpacity: 40,
      backgroundOverlayColor: "#000000",
      backgroundSlideshowEnabled: false,
      backgroundSlideshowDuration: 5000,
      backgroundSlideshowTransition: "fade",
      backgroundImages: []
    }
    
    return NextResponse.json(defaultBanner)
  }
}
