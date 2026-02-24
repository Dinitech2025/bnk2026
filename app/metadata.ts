import { Metadata } from 'next'
import { db } from '@/lib/db'

async function getSettings() {
  try {
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value || ''
    })
    
    return settingsMap
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  
  return {
    title: settings.metaTitle || settings.siteName || 'Boutik\'nakà',
    description: settings.metaDescription || settings.siteDescription || 'Plateforme e-commerce et services',
    keywords: settings.metaKeywords || 'ecommerce, boutique, streaming, produits, services',
    icons: {
      icon: settings.faviconUrl || '/favicon.ico',
    },
  }
} 