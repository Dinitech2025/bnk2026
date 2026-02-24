'use client'

import { useState, useEffect } from 'react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, ExternalLink } from 'lucide-react'
import Image from 'next/image'

export default function DebugSettingsPage() {
  const { settings, isLoading, error, reloadSettings } = useSiteSettings()
  const [apiData, setApiData] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Test direct de l'API
  const testAPI = async () => {
    try {
      setApiError(null)
      const response = await fetch('/api/settings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setApiData(data)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  useEffect(() => {
    testAPI()
  }, [])

  const siteName = getSetting(settings, 'siteName', 'BoutikNaka')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const faviconUrl = getSetting(settings, 'faviconUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  // Fonction pour forcer le rechargement du favicon
  const reloadFavicon = () => {
    if (typeof window === 'undefined') return
    const links = document.querySelectorAll("link[rel*='icon']")
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href) {
        link.setAttribute('href', href + '?v=' + Date.now())
      }
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug des paramètres du site</h1>
        <div className="flex gap-2">
          <Button onClick={reloadSettings} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recharger Hook
          </Button>
          <Button onClick={testAPI} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tester API
          </Button>
          <Button onClick={reloadFavicon} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recharger Favicon
          </Button>
        </div>
      </div>

      {/* Test spécifique du favicon */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Test du Favicon</CardTitle>
          <CardDescription>
            Diagnostic spécifique du favicon dans l'onglet du navigateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Paramètres favicon :</h4>
                <ul className="space-y-1 text-sm">
                  <li>📝 <strong>faviconUrl (hook):</strong> {faviconUrl || '❌ Aucun'}</li>
                  <li>📝 <strong>faviconUrl (API):</strong> {apiData?.faviconUrl || '❌ Aucun'}</li>
                  <li>🔧 <strong>Favicon actuel du navigateur:</strong> 
                    <span className="ml-2">
                      {typeof window !== 'undefined' && document?.querySelector("link[rel*='icon']")?.getAttribute('href') || '❌ Aucun'}
                    </span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Actions de test :</h4>
                <div className="space-y-2">
                  {faviconUrl && (
                    <a 
                      href={faviconUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Ouvrir le favicon dans un nouvel onglet
                    </a>
                  )}
                  <div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (typeof window === 'undefined') return
                        const currentFavicon = document.querySelector("link[rel*='icon']")?.getAttribute('href')
                        alert(`Favicon actuel: ${currentFavicon || 'Aucun'}`)
                      }}
                    >
                      Vérifier favicon actuel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {faviconUrl && (
              <div className="border rounded p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Aperçu du favicon :</h4>
                <div className="flex items-center space-x-4">
                  <div className="relative h-8 w-8 border">
                    <Image
                      src={faviconUrl}
                      alt="Favicon"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        console.error('Erreur de chargement du favicon:', e)
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">Taille 32x32px (aperçu)</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test du hook useSiteSettings */}
        <Card>
          <CardHeader>
            <CardTitle>Hook useSiteSettings</CardTitle>
            <CardDescription>
              Données récupérées via le hook React
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="text-blue-600">⏳ Chargement...</p>
            )}
            
            {error && (
              <p className="text-red-600">❌ Erreur: {error}</p>
            )}
            
            {settings && (
              <div className="space-y-2">
                <p><strong>Nom du site:</strong> {siteName}</p>
                <p><strong>Logo URL:</strong> {logoUrl || 'Aucun'}</p>
                <p><strong>Favicon URL:</strong> {faviconUrl || 'Aucun'}</p>
                <p><strong>Utiliser logo:</strong> {useSiteLogo ? 'Oui' : 'Non'}</p>
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">
                    Voir tous les paramètres ({Object.keys(settings).length})
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(settings, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test direct de l'API */}
        <Card>
          <CardHeader>
            <CardTitle>API /api/settings</CardTitle>
            <CardDescription>
              Test direct de l'API REST
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiError && (
              <p className="text-red-600">❌ Erreur API: {apiError}</p>
            )}
            
            {apiData && (
              <div className="space-y-2">
                <p><strong>Nom du site:</strong> {apiData.siteName || 'Aucun'}</p>
                <p><strong>Logo URL:</strong> {apiData.logoUrl || 'Aucun'}</p>
                <p><strong>Favicon URL:</strong> {apiData.faviconUrl || 'Aucun'}</p>
                <p><strong>Utiliser logo:</strong> {apiData.useSiteLogo === 'true' ? 'Oui' : 'Non'}</p>
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">
                    Voir tous les paramètres API ({Object.keys(apiData).length})
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(apiData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 