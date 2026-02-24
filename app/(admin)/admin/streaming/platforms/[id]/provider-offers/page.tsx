'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  hasMultipleOffers: boolean
}

interface ProviderOffer {
  id: string
  name: string
  price: number
  currency: string
  deviceCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export default function ProviderOffersPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [offers, setOffers] = useState<ProviderOffer[]>([])
  const [newOffer, setNewOffer] = useState({
    name: '',
    price: 0,
    currency: 'TRY',
    deviceCount: 1,
    isActive: true
  })

  // Charger les données de la plateforme et ses offres
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger la plateforme
        const platformResponse = await fetch(`/api/admin/streaming/platforms/${id}`)
        if (!platformResponse.ok) throw new Error('Erreur lors du chargement de la plateforme')
        const platformData = await platformResponse.json()
        setPlatform(platformData)

        // Charger les offres
        const offersResponse = await fetch(`/api/admin/streaming/platforms/${id}/provider-offers`)
        if (!offersResponse.ok) throw new Error('Erreur lors du chargement des offres')
        const offersData = await offersResponse.json()
        setOffers(offersData)
      } catch (error) {
        toast.error('Erreur lors du chargement des données')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handleAddOffer = async () => {
    if (!newOffer.name || newOffer.price <= 0 || newOffer.deviceCount < 1) {
      toast.error('Veuillez remplir tous les champs correctement')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/streaming/platforms/${id}/provider-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOffer),
      })

      if (!response.ok) throw new Error('Erreur lors de l\'ajout de l\'offre')

      const addedOffer = await response.json()
      setOffers(prev => [...prev, addedOffer])
      setNewOffer({
        name: '',
        price: 0,
        currency: 'TRY',
        deviceCount: 1,
        isActive: true
      })
      toast.success('Offre ajoutée avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'offre')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/admin/streaming/platforms/${id}/provider-offers?offerId=${offerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression de l\'offre')

      setOffers(prev => prev.filter(offer => offer.id !== offerId))
      toast.success('Offre supprimée avec succès')
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'offre')
      console.error(error)
    }
  }

  if (isLoading || !platform) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!platform.hasMultipleOffers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2"
            onClick={() => router.push(`/admin/streaming/platforms/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <p>Le mode multi-offres n'est pas activé pour cette plateforme.</p>
              <p>Activez-le dans les paramètres de la plateforme pour gérer les offres.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            onClick={() => router.push(`/admin/streaming/platforms/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Gestion des offres</h1>
        </div>
        <p className="text-muted-foreground">Plateforme : {platform.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une offre</CardTitle>
          <CardDescription>
            Créez une nouvelle offre fournisseur pour cette plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'offre</Label>
              <Input
                value={newOffer.name}
                onChange={(e) => setNewOffer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Standard, Premium"
              />
            </div>

            <div className="space-y-2">
              <Label>Prix par mois</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newOffer.price}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  min="0"
                  step="0.01"
                />
                <Input
                  value={newOffer.currency}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-24"
                  placeholder="TRY"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre d'appareils</Label>
              <Input
                type="number"
                value={newOffer.deviceCount}
                onChange={(e) => setNewOffer(prev => ({ ...prev, deviceCount: parseInt(e.target.value) }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={newOffer.isActive}
                  onCheckedChange={(checked) => setNewOffer(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Actif</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAddOffer} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            Ajouter l'offre
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offres existantes</CardTitle>
          <CardDescription>
            Liste des offres disponibles pour cette plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length > 0 ? (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{offer.name}</h3>
                      <Badge variant={offer.isActive ? 'default' : 'secondary'}>
                        {offer.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteOffer(offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Prix mensuel</p>
                      <p className="font-medium">
                        {offer.price.toLocaleString('tr-TR', { 
                          style: 'currency', 
                          currency: offer.currency 
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Appareils autorisés</p>
                      <p className="font-medium">{offer.deviceCount}</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Créé le {formatDate(offer.createdAt)}</p>
                    <p>Mis à jour le {formatDate(offer.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>Aucune offre disponible</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 