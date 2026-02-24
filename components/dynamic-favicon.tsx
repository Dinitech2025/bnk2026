'use client'

import { useEffect } from 'react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'

export function DynamicFavicon() {
  const { settings, isLoading } = useSiteSettings()
  
  useEffect(() => {
    if (!isLoading && settings) {
      const faviconUrl = getSetting(settings, 'faviconUrl', '/favicon.ico')
      
      // Trouver l'élément favicon existant ou le créer
      let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      
      if (!favicon) {
        // Créer un nouvel élément favicon s'il n'existe pas
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      
      // Mettre à jour l'URL du favicon avec un timestamp pour éviter le cache
      const timestampedUrl = faviconUrl.includes('?') 
        ? `${faviconUrl}&t=${Date.now()}`
        : `${faviconUrl}?t=${Date.now()}`
      
      favicon.href = timestampedUrl
      
      console.log('🔄 Favicon mis à jour:', timestampedUrl)
    }
  }, [settings, isLoading])

  // Ce composant ne rend rien visuellement
  return null
} 