'use client'

import { Metadata } from 'next'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from "@/components/ui/skeleton"
import ProfilesManager from '@/components/streaming/ProfilesManager'
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  websiteUrl: string | null
  hasProfiles: boolean
  hasMultipleOffers: boolean
  providerOffers: ProviderOffer[]
}

interface ProviderOffer {
  id: string
  name: string
  price: number
  currency: string
  deviceCount: number
  description?: string | null
}

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
}

interface Profile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  subscription: Subscription | null
  account: Account
}

interface AccountProfile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  subscriptionId: string | null
  subscription: Subscription | null
  account: Account
}

interface Account {
  id: string
  username: string | null
  email: string | null
  password: string
  status: string
  platformId: string
  platform: Platform
  providerOfferId: string | null
  accountProfiles: AccountProfile[]
  createdAt: string
  updatedAt: string
}

interface FormData {
  username: string
  email: string | null
  password: string
  status: string
  platformId: string
  providerOfferId: string | null
  expiresAt: string | null
}

export default function EditAccountPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [account, setAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: null,
    password: '',
    status: 'ACTIVE',
    platformId: '',
    providerOfferId: null,
    expiresAt: null
  })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)

  useEffect(() => {
    fetchAccountDetails()
  }, [id])

  const fetchAccountDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/streaming/accounts/${id}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails du compte')
      
      const data = await response.json()
      console.log('Données du compte:', data) // Pour le débogage
      
      setAccount(data)
      setFormData({
        username: data.username || '',
        email: data.email,
        password: data.password,
        status: data.status,
        platformId: data.platformId,
        providerOfferId: data.providerOfferId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().split('T')[0] : null
      })
      
      // S'assurer que les offres fournisseur sont disponibles
      if (data.platform.hasMultipleOffers && (!data.platform.providerOffers || data.platform.providerOffers.length === 0)) {
        // Charger les offres fournisseur si elles ne sont pas incluses
        const platformResponse = await fetch(`/api/admin/streaming/platforms/${data.platformId}`)
        if (platformResponse.ok) {
          const platformData = await platformResponse.json()
          setSelectedPlatform({
            ...data.platform,
            providerOffers: platformData.providerOffers || []
          })
        }
      } else {
        setSelectedPlatform(data.platform)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des détails du compte')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/admin/streaming/platforms')
      if (!response.ok) throw new Error('Erreur lors du chargement des plateformes')
      const data = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des plateformes')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      platformId: value,
      providerOfferId: null // Reset provider offer when platform changes
    }))
    
    // Mettre à jour la plateforme sélectionnée
    const platform = platforms.find(p => p.id === value) || null
    setSelectedPlatform(platform)
  }

  const handleProviderOfferChange = (value: string) => {
    setFormData(prev => ({ ...prev, providerOfferId: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    // Vérifier si une offre fournisseur est requise
    if (selectedPlatform?.hasMultipleOffers && !formData.providerOfferId) {
      toast.error('Veuillez sélectionner une offre fournisseur')
      return
    }
    
    setIsSubmitting(true)
    try {
      // Préparer les données à envoyer
      const dataToSend = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      }
      
      const response = await fetch(`/api/admin/streaming/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour du compte')
      }
      
      toast.success('Compte mis à jour avec succès')
      router.push(`/admin/streaming/accounts/${id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du compte')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchAccountDetails}
            className="mt-4"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !account) {
    return (
      <div className="space-y-6 p-6">
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
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
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
        <h1 className="text-2xl font-bold">Modifier le compte</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>
              Modifier les informations de connexion du compte
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            {/* Plateforme */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {selectedPlatform?.logo ? (
                    <Image
                      src={selectedPlatform.logo}
                      alt={selectedPlatform.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      {selectedPlatform?.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{selectedPlatform?.name}</div>
                  <Badge variant="outline">{selectedPlatform?.type}</Badge>
                </div>
              </div>

              {/* Offre fournisseur */}
              {selectedPlatform?.hasMultipleOffers && (
                <div className="mt-4">
                  <Label htmlFor="providerOfferId">Offre fournisseur</Label>
                  <Select
                    value={formData.providerOfferId || ''}
                    onValueChange={handleProviderOfferChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une offre" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPlatform.providerOffers.map((offer) => (
                        <SelectItem key={offer.id} value={offer.id}>
                          {offer.name} - {offer.price} {offer.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Champs de formulaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
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
                    value={formData.email || ''}
                    onChange={handleChange}
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Statut du compte</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="INACTIVE">Inactif</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Date d'expiration</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  value={formData.expiresAt || ''}
                  onChange={handleChange}
                  placeholder="Sélectionner une date d'expiration"
                />
                <p className="text-sm text-muted-foreground">
                  Laissez vide si le compte n'expire pas
                </p>
              </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>

      {/* Gestion des profils */}
      {account && (
        <Card>
          <CardHeader>
            <CardTitle>Gestion des profils</CardTitle>
            <CardDescription>
              Gérez les profils associés à ce compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilesManager
              accountId={account.id}
              profiles={account.accountProfiles}
              maxProfiles={account.platform.maxProfilesPerAccount || 1}
              onProfilesChange={fetchAccountDetails}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
} 