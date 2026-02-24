'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, RefreshCw, BarChart3, Users, ShoppingCart, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface CartStatistics {
  expired: {
    totalCarts: number
    guestCarts: number
    userCarts: number
    totalItems: number
  }
  active: {
    totalCarts: number
    guestCarts: number
    userCarts: number
  }
  expirySettings: {
    guestCartExpiryDays: number
    lastCheck: string
  }
}

interface CleanupResult {
  success: boolean
  message: string
  cleaned: {
    carts: number
    items: number
  }
  statistics?: {
    totalExpiredCarts: number
    guestCarts: number
    userCarts: number
  }
  cleanupDate?: string
}

export function CartCleanupManager() {
  const [statistics, setStatistics] = useState<CartStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null)

  const fetchStatistics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/carts/cleanup')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }
      
      const data = await response.json()
      setStatistics(data.statistics)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les statistiques des paniers')
    } finally {
      setIsLoading(false)
    }
  }

  const performCleanup = async () => {
    try {
      setIsCleaningUp(true)
      const response = await fetch('/api/admin/carts/cleanup', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du nettoyage')
      }
      
      const result: CleanupResult = await response.json()
      setLastCleanup(result)
      
      if (result.success) {
        toast.success(result.message)
        // Recharger les statistiques après le nettoyage
        await fetchStatistics()
      } else {
        toast.error('Échec du nettoyage')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du nettoyage des paniers')
    } finally {
      setIsCleaningUp(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers Expirés</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.expired.totalCarts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.expired.totalItems || 0} articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers Actifs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.active.totalCarts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En cours d'utilisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers Invités</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statistics?.expired.guestCarts || 0) + (statistics?.active.guestCarts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.expired.guestCarts || 0} expirés, {statistics?.active.guestCarts || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.expirySettings.guestCartExpiryDays || 3}j
            </div>
            <p className="text-xs text-muted-foreground">
              Durée de vie des paniers invités
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Actions de Nettoyage
          </CardTitle>
          <CardDescription>
            Gérez les paniers expirés et surveillez l'état du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={fetchStatistics}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser les statistiques
            </Button>

            <Button
              onClick={performCleanup}
              disabled={isCleaningUp || (statistics?.expired.totalCarts || 0) === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className={`h-4 w-4 ${isCleaningUp ? 'animate-pulse' : ''}`} />
              {isCleaningUp ? 'Nettoyage en cours...' : 'Nettoyer les paniers expirés'}
            </Button>
          </div>

          {statistics?.expired.totalCarts === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              ✅ Aucun panier expiré à nettoyer
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultat du dernier nettoyage */}
      {lastCleanup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dernier Nettoyage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={lastCleanup.success ? "default" : "destructive"}>
                {lastCleanup.success ? "Succès" : "Échec"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {lastCleanup.cleanupDate && new Date(lastCleanup.cleanupDate).toLocaleString('fr-FR')}
              </span>
            </div>
            
            <p className="text-sm">{lastCleanup.message}</p>
            
            {lastCleanup.success && lastCleanup.cleaned && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Paniers supprimés:</span>
                  <span className="ml-2 text-red-600">{lastCleanup.cleaned.carts}</span>
                </div>
                <div>
                  <span className="font-medium">Articles supprimés:</span>
                  <span className="ml-2 text-red-600">{lastCleanup.cleaned.items}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations sur l'automatisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Automatisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Le nettoyage automatique s'exécute à chaque accès à l'API des paniers. 
            Pour un nettoyage périodique plus régulier, vous pouvez configurer un cron job :
          </p>
          
          <div className="bg-muted p-3 rounded-md font-mono text-sm">
            <div># Nettoyage quotidien à 2h du matin</div>
            <div>0 2 * * * npm run cleanup:carts</div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Ou utilisez l'API: POST /api/admin/carts/cleanup
          </p>
        </CardContent>
      </Card>
    </div>
  )
}




