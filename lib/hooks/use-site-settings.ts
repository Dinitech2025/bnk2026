import { useState, useEffect, useCallback } from 'react'

// Cache global des paramètres pour éviter les recharges inutiles
let globalSettings: SiteSettings | null = null
let globalIsLoading = false
let globalError: string | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface SiteSettings {
  siteName: string
  siteDescription: string
  siteTagline: string
  logoUrl: string
  faviconUrl: string
  adminLogoUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  currency: string
  currencySymbol: string
  sloganMG: string
  sloganFR: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  useSiteLogo: string
  bannerUrl: string
  footerText: string
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  youtubeUrl: string
  [key: string]: string
}

// Fonction pour récupérer les paramètres avec cache intelligent
async function fetchSiteSettings(): Promise<SiteSettings> {
  const now = Date.now()
  
  // Utiliser le cache si disponible et valide
  if (globalSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return globalSettings
  }

  try {
    const response = await fetch('/api/settings', {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5 minutes
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des paramètres')
    }
    
    const data = await response.json()
    
    // Mettre à jour le cache global
    globalSettings = data
    lastFetchTime = now
    globalError = null
    
    return data
  } catch (error) {
    // En cas d'erreur, utiliser le cache si disponible
    if (globalSettings) {
      console.warn('Erreur API, utilisation du cache:', error)
      return globalSettings
    }
    throw error
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(globalSettings)
  const [isLoading, setIsLoading] = useState(globalIsLoading)
  const [error, setError] = useState<string | null>(globalError)

  const loadSettings = useCallback(async () => {
    // Si on a déjà des données en cache, les utiliser immédiatement
    if (globalSettings && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      setSettings(globalSettings)
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      globalIsLoading = true
      setIsLoading(true)
      setError(null)
      
      const data = await fetchSiteSettings()
      
      globalSettings = data
      globalIsLoading = false
      globalError = null
      
      setSettings(data)
      setIsLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      globalError = errorMessage
      globalIsLoading = false
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Fonction pour recharger manuellement les paramètres (force le rechargement)
  const reloadSettings = useCallback(() => {
    lastFetchTime = 0 // Force le rechargement
    loadSettings()
  }, [loadSettings])

  return { settings, isLoading, error, reloadSettings }
}

// Fonction utilitaire pour obtenir un paramètre avec une valeur par défaut
export function getSetting(settings: SiteSettings | null, key: string, defaultValue: string = ''): string {
  if (!settings) return defaultValue
  return settings[key] || defaultValue
} 