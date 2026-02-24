'use client'

import { useEffect } from 'react'
import Head from 'next/head'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'

interface SiteMetadataProps {
  title?: string
  description?: string
}

export function SiteMetadata({ title, description }: SiteMetadataProps) {
  const { settings, isLoading } = useSiteSettings()

  // Valeurs par défaut ou personnalisées
  const siteName = getSetting(settings, 'siteName', 'Boutik\'nakà')
  const siteDescription = getSetting(settings, 'siteDescription', 'Boutique en ligne')
  
  const pageTitle = title 
    ? `${title} | ${siteName}` 
    : getSetting(settings, 'metaTitle', siteName)
    
  const pageDescription = description 
    || getSetting(settings, 'metaDescription', siteDescription)
    
  const favicon = getSetting(settings, 'faviconUrl', '/favicon.ico')
  const metaKeywords = getSetting(settings, 'metaKeywords', '')

  // Mettre à jour le titre de la page
  useEffect(() => {
    if (!isLoading) {
      document.title = pageTitle
    }
  }, [pageTitle, isLoading])

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:site_name" content={siteName} />
      {metaKeywords && (
        <meta name="keywords" content={metaKeywords} />
      )}
      <link rel="icon" href={favicon} />
    </Head>
  )
} 