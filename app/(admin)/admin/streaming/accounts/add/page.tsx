'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Check, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  websiteUrl: string | null
  hasProfiles: boolean
  hasMultipleOffers: boolean
  hasGiftCards: boolean
  providerOffers?: ProviderOffer[]
}

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
  platformId: string
  usedById: string | null
  usedAt: Date | null
  expiresAt: Date | null
}

interface ProviderOffer {
  id: string
  name: string
  price: number
  currency: string
  deviceCount: number
  description?: string | null
}

interface FormData {
  username: string
  email: string
  password: string
  platformId: string
  providerOfferId?: string | null
  selectedGiftCards: string[]
  expiresAt?: string | null
  isActive?: boolean
}

export default function AddAccountPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    platformId: '',
    providerOfferId: null,
    selectedGiftCards: [],
    expiresAt: null,
    isActive: false
  })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [availableGiftCards, setAvailableGiftCards] = useState<GiftCard[]>([])
  const [isLoadingGiftCards, setIsLoadingGiftCards] = useState(false)
  const [selectedGiftCards, setSelectedGiftCards] = useState<GiftCard[]>([])
  const [estimatedExpirationDate, setEstimatedExpirationDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchPlatforms()
  }, [])

  useEffect(() => {
    if (selectedPlatform?.hasGiftCards) {
      fetchAvailableGiftCards(selectedPlatform.id)
    }
  }, [selectedPlatform])

  const fetchPlatforms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/streaming/platforms')
      if (!response.ok) throw new Error('Erreur lors du chargement des plateformes')
      const data = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des plateformes')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableGiftCards = async (platformId: string) => {
    setIsLoadingGiftCards(true)
    try {
      const response = await fetch(`/api/admin/streaming/gift-cards?platformId=${platformId}&status=ACTIVE`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du chargement des cartes cadeaux')
      }
      const data = await response.json()
      // Filtrer les cartes cadeaux pour ne garder que celles qui sont réellement disponibles
      const availableCards = data.filter((card: GiftCard) => 
        card.status === 'ACTIVE' && 
        !card.usedById && 
        !card.usedAt && 
        (!card.expiresAt || new Date(card.expiresAt) > new Date())
      )
      setAvailableGiftCards(availableCards)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement des cartes cadeaux')
    } finally {
      setIsLoadingGiftCards(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      platformId: value,
      providerOfferId: null, // Reset provider offer when platform changes
      selectedGiftCards: [] // Reset selected gift cards when platform changes
    }))
    
    // Mettre à jour la plateforme sélectionnée
    const platform = platforms.find(p => p.id === value) || null
    setSelectedPlatform(platform)
  }

  const calculateExpirationDate = (): Date | null => {
    if (!formData.providerOfferId || selectedGiftCards.length === 0) {
      return null
    }

    const selectedOffer = selectedPlatform?.providerOffers?.find(po => po.id === formData.providerOfferId)
    if (!selectedOffer) {
      return null
    }

    // Calculer le montant total des cartes cadeaux
    const totalAmount = selectedGiftCards.reduce((sum, card) => sum + card.amount, 0)
    
    // Calculer le prix journalier (prix mensuel / 30)
    const dailyPrice = selectedOffer.price / 30
    
    // Calculer le nombre de jours
    const days = Math.floor(totalAmount / dailyPrice)
    
    // Calculer la date d'expiration
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + days)
    return expirationDate
  }

  useEffect(() => {
    const newExpirationDate = calculateExpirationDate()
    setEstimatedExpirationDate(newExpirationDate)
  }, [selectedGiftCards, formData.providerOfferId])

  const handleGiftCardToggle = (card: GiftCard) => {
    setSelectedGiftCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      const newSelection = isSelected
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
      return newSelection
    })
  }

  const handleProviderOfferChange = (value: string) => {
    setFormData(prev => ({ ...prev, providerOfferId: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password || !formData.platformId) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Vérifier si la plateforme nécessite des cartes cadeaux
    if (selectedPlatform?.hasGiftCards && selectedGiftCards.length === 0) {
      // Si la plateforme accepte les cartes cadeaux mais qu'aucune n'est sélectionnée,
      // créer le compte comme indisponible et inactif
      setIsSubmitting(true)
      try {
        const accountResponse = await fetch('/api/admin/streaming/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            status: 'INACTIVE',
            availability: false
          }),
        })
        
        if (!accountResponse.ok) throw new Error('Erreur lors de la création du compte')
        const accountData = await accountResponse.json()
        
        toast.success('Compte créé avec succès (indisponible)')
        router.push(`/admin/streaming/accounts/${accountData.id}`)
      } catch (error) {
        console.error('Erreur:', error)
        toast.error('Erreur lors de la création du compte')
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    
    setIsSubmitting(true)
    try {
      // Déterminer le statut et la disponibilité en fonction de la date d'expiration
      let status = 'INACTIVE'
      let availability = false

      if (!selectedPlatform?.hasGiftCards && formData.expiresAt) {
        const expirationDate = new Date(formData.expiresAt)
        if (expirationDate > new Date()) {
          status = 'ACTIVE'
          availability = true
        }
      }

      // Créer le compte
      const accountResponse = await fetch('/api/admin/streaming/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status,
          availability
        }),
      })
      
      if (!accountResponse.ok) throw new Error('Erreur lors de la création du compte')
      const accountData = await accountResponse.json()

      // Si des cartes cadeaux sont sélectionnées, les associer au compte
      if (selectedGiftCards.length > 0 && estimatedExpirationDate) {
        try {
          const activationResponse = await fetch(`/api/admin/streaming/accounts/${accountData.id}/activate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              giftCardIds: selectedGiftCards.map(card => card.id),
              expiresAt: estimatedExpirationDate.toISOString()
            }),
          })
          
          if (!activationResponse.ok) {
            throw new Error('Erreur lors de l\'association des cartes cadeaux')
          }

          const activationData = await activationResponse.json()
          
          // Vérifier que toutes les cartes ont été mises à jour
          if (!activationData.updatedGiftCards || activationData.updatedGiftCards.length !== selectedGiftCards.length) {
            toast.error('Certaines cartes cadeaux n\'ont pas pu être associées')
            router.push(`/admin/streaming/accounts/${accountData.id}`)
            return
          }

          toast.success('Compte créé et cartes cadeaux associées avec succès')
        } catch (error) {
          console.error('Erreur lors de l\'activation:', error)
          toast.error('Le compte a été créé mais les cartes cadeaux n\'ont pas pu être associées')
          router.push(`/admin/streaming/accounts/${accountData.id}`)
          return
        }
      }
      
      toast.success('Compte créé avec succès')
      router.push(`/admin/streaming/accounts/${accountData.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création du compte')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            onClick={fetchPlatforms}
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm"
          className="mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Ajouter un compte</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>
              Ajoutez un nouveau compte à votre système.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection de la plateforme */}
            <div className="space-y-2">
              <Label htmlFor="platformId">Plateforme <span className="text-red-500">*</span></Label>
              <Select
                value={formData.platformId}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une plateforme" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      <div className="flex items-center">
                        {platform.logo && (
                          <div className="relative w-4 h-4 mr-2">
                            <Image
                              src={platform.logo}
                              alt={platform.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        {platform.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Informations de connexion */}
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur <span className="text-red-500">*</span></Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Section des offres fournisseur */}
            {selectedPlatform?.hasMultipleOffers && (
              <div className="space-y-2">
                <Label htmlFor="providerOfferId">Offre fournisseur</Label>
                <Select
                  value={formData.providerOfferId || ''}
                  onValueChange={handleProviderOfferChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une offre" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPlatform.providerOffers?.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.name} - {offer.price} {offer.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Section des cartes cadeaux */}
            {selectedPlatform?.hasGiftCards && (
              <Card>
                <CardHeader>
                  <CardTitle>Cartes cadeaux</CardTitle>
                  <CardDescription>
                    Sélectionnez une ou plusieurs cartes cadeaux pour recharger le compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingGiftCards ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : availableGiftCards.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {availableGiftCards.map((card) => (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => handleGiftCardToggle(card)}
                            className={`w-full p-4 text-left border rounded-lg hover:bg-accent transition-colors ${
                              selectedGiftCards.some(c => c.id === card.id) 
                                ? 'border-primary bg-accent/50' 
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {selectedGiftCards.some(c => c.id === card.id) ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <Plus className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">{card.code}</span>
                              </div>
                              <Badge variant="secondary">
                                {card.amount} {card.currency}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedGiftCards.length > 0 && (
                        <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Cartes sélectionnées :</span>
                            <span>{selectedGiftCards.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Montant total :</span>
                            <span className="font-medium">
                              {selectedGiftCards.reduce((sum, card) => sum + card.amount, 0)} {selectedGiftCards[0].currency}
                            </span>
                          </div>
                          {estimatedExpirationDate && formData.providerOfferId && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Date d'expiration estimée :</span>
                              <span>{estimatedExpirationDate.toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>Aucune carte cadeau disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Date d'expiration (seulement si la plateforme n'utilise pas de cartes cadeaux) */}
            {selectedPlatform && !selectedPlatform.hasGiftCards && (
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Date d'expiration</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt || ''}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Statut du compte */}
            {!selectedPlatform?.hasGiftCards && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isActive">Compte actif</Label>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/streaming/accounts')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 