import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Récupérer les paramètres généraux (version publique)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/settings: Récupération des paramètres...')
    
    // Récupérer tous les paramètres
    const settings = await prisma.setting.findMany()

    console.log(`📊 Trouvé ${settings.length} paramètres`)

    // Transformer en objet clé-valeur
    const settingsObject: Record<string, string> = {}
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value || ''
    })

    // Ajouter des valeurs par défaut si nécessaire
    const defaultSettings = {
      siteName: 'Boutik\'nakà',
      logoUrl: '',
      useSiteLogo: 'false',
      faviconUrl: '/favicon.ico',
      adminLogoUrl: '',
      bannerUrl: '',
      footerText: '© 2024 Boutik\'nakà. Tous droits réservés.',
      siteDescription: 'Votre boutique en ligne de confiance',
      siteTagline: 'Service d\'achat en ligne à Madagascar',
      contactEmail: '',
      contactPhone: '',
      address: '',
      currency: 'MGA',
      currencySymbol: 'Ar',
      sloganMG: '',
      sloganFR: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      youtubeUrl: ''
    }

    // Fusionner avec les valeurs par défaut
    const finalSettings = { ...defaultSettings, ...settingsObject }

    console.log('✅ Paramètres récupérés:', {
      siteName: finalSettings.siteName,
      logoUrl: finalSettings.logoUrl ? 'Défini' : 'Non défini',
      useSiteLogo: finalSettings.useSiteLogo,
      totalSettings: Object.keys(finalSettings).length
    })

    return NextResponse.json(finalSettings)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des paramètres:', error)
    
    // Retourner des paramètres par défaut en cas d'erreur
    const fallbackSettings = {
      siteName: 'Boutik\'nakà',
      logoUrl: '',
      useSiteLogo: 'false',
      faviconUrl: '/favicon.ico',
      adminLogoUrl: '',
      bannerUrl: '',
      footerText: '© 2024 Boutik\'nakà. Tous droits réservés.',
      siteDescription: 'Votre boutique en ligne de confiance',
      siteTagline: 'Service d\'achat en ligne à Madagascar',
      contactEmail: '',
      contactPhone: '',
      address: '',
      currency: 'MGA',
      currencySymbol: 'Ar',
      sloganMG: '',
      sloganFR: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      youtubeUrl: ''
    }
    
    return NextResponse.json(fallbackSettings)
  }
} 