'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/profiles?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Données brutes:', data)
      setProfiles(data)
      setError(null)
    } catch (error: any) {
      console.error('Erreur:', error)
      setError(error.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Débogage des Profils</h1>
      
      <div className="flex space-x-4">
        <Button onClick={fetchProfiles} disabled={loading}>
          {loading ? 'Chargement...' : 'Actualiser les données'}
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/admin/streaming/profiles'}>
          Retour à la liste
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-[70vh]">
        <p className="mb-2 font-semibold">Nombre de profils: {profiles.length}</p>
        
        {loading ? (
          <p>Chargement des données...</p>
        ) : profiles.length === 0 ? (
          <p>Aucun profil trouvé dans l'API</p>
        ) : (
          <pre className="text-xs">{JSON.stringify(profiles, null, 2)}</pre>
        )}
      </div>
    </div>
  )
} 