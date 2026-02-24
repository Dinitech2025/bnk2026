import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CartCleanupManager } from '@/components/admin/carts/cart-cleanup-manager'

export default function CartsAdminPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Paniers</h1>
        <p className="text-muted-foreground">
          Gérez les paniers de session et nettoyez les paniers expirés
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧹 Nettoyage des Paniers Expirés
            </CardTitle>
            <CardDescription>
              Les paniers des invités expirent automatiquement après 3 jours. 
              Utilisez cette interface pour surveiller et nettoyer manuellement les paniers expirés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <CartCleanupManager />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}