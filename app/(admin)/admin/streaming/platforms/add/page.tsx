'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Globe, Users, Tag, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'
import { PlatformLogoUpload } from '@/components/ui/platform-logo-upload'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Types de plateformes disponibles
const platformTypes = [
  { value: 'VIDEO', label: 'Vidéo' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'VPN', label: 'VPN' },
  { value: 'CLOUD', label: 'Cloud' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'OTHER', label: 'Autre' },
]

export default function AddPlatformPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [platformData, setPlatformData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    logoMediaId: '',
    websiteUrl: '',
    type: 'VIDEO',
    hasProfiles: true,
    maxProfilesPerAccount: 5 as number | null,
    isActive: true,
    hasMultipleOffers: false,
    hasGiftCards: false,
    providerOffers: [] as Array<{
      name: string,
      price: number,
      deviceCount: number,
      currency: string,
      isActive: boolean
    }>
  })
  const [newOffer, setNewOffer] = useState({
    name: '',
    price: 0,
    currency: 'TRY',
    deviceCount: 1,
    isActive: true
  })

  // Vérifier si le type de plateforme nécessite des profils
  const requiresProfiles = ['VIDEO', 'AUDIO', 'GAMING'].includes(platformData.type)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPlatformData(prev => ({ ...prev, [name]: value }))
    
    // Générer automatiquement le slug à partir du nom
    if (name === 'name') {
      setPlatformData(prev => ({ ...prev, slug: slugify(value) }))
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPlatformData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const handleSwitchChange = (name: string, value: boolean) => {
    setPlatformData(prev => {
      if (name === 'hasProfiles') {
        return {
          ...prev,
          [name]: value,
          maxProfilesPerAccount: value ? 5 : null
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setPlatformData(prev => {
      if (name === 'type') {
        const defaultHasProfiles = ['VIDEO', 'AUDIO', 'GAMING'].includes(value)
        return {
          ...prev,
          [name]: value,
          hasProfiles: defaultHasProfiles,
          maxProfilesPerAccount: defaultHasProfiles ? 5 : null
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Erreur lors du téléchargement')
      
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    try {
      // Validation basique
      if (!platformData.name) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        setIsLoading(false)
        return
      }

      // Validation des offres fournisseur si activé
      if (platformData.hasMultipleOffers) {
        if (platformData.providerOffers.length === 0) {
          toast.error('Veuillez ajouter au moins une offre fournisseur')
          setIsLoading(false)
          return
        }

        // Vérifier que chaque offre est complète
        const invalidOffer = platformData.providerOffers.find(
          offer => !offer.name || offer.price <= 0 || offer.deviceCount < 1
        )
        if (invalidOffer) {
          toast.error('Veuillez remplir correctement toutes les offres fournisseur')
          setIsLoading(false)
          return
        }
      }
      
      // S'assurer que le slug est correctement généré
      const dataToSubmit = {
        ...platformData,
        slug: slugify(platformData.name),
        // Exclure le tableau providerOffers de la requête principale
        providerOffers: undefined
      }
      
      const response = await fetch('/api/admin/streaming/platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Erreur lors de la création de la plateforme')
      }

      // Si des offres fournisseur sont définies, les créer
      if (platformData.hasMultipleOffers && responseData.id) {
        try {
          const offersPromises = platformData.providerOffers.map(offer =>
            fetch(`/api/admin/streaming/platforms/${responseData.id}/provider-offers`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: offer.name,
                price: parseFloat(offer.price.toString()),
                currency: offer.currency || 'TRY',
                deviceCount: parseInt(offer.deviceCount.toString()),
                isActive: offer.isActive
              }),
            }).then(res => {
              if (!res.ok) throw new Error('Erreur lors de la création de l\'offre')
              return res.json()
            })
          )

          await Promise.all(offersPromises)
        } catch (error) {
          console.error('Erreur lors de la création des offres:', error)
          toast.error('La plateforme a été créée mais certaines offres n\'ont pas pu être ajoutées')
          router.push('/admin/streaming/platforms')
          return
        }
      }
      
      toast.success('Plateforme ajoutée avec succès')
      router.push('/admin/streaming/platforms')
    } catch (error: any) {
      console.error('Erreur complète:', error)
      toast.error(error.message || 'Erreur lors de la création de la plateforme')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/admin/streaming/platforms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Ajouter une plateforme</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations de la plateforme</CardTitle>
            <CardDescription>
              Ajoutez une nouvelle plateforme de streaming à votre système.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <PlatformLogoUpload
                value={platformData.logo}
                onChange={(url) => setPlatformData(prev => ({ ...prev, logo: url }))}
                onUpload={handleImageUpload}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={platformData.name}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Slug: {platformData.slug || '(généré automatiquement)'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profils multiples</Label>
                  <p className="text-sm text-muted-foreground">
                    Autoriser plusieurs profils par compte
                  </p>
                </div>
                <Switch
                  checked={platformData.hasProfiles}
                  onCheckedChange={(checked) => handleSwitchChange('hasProfiles', checked)}
                />
              </div>

              {platformData.hasProfiles && (
                <div className="space-y-2">
                  <Label htmlFor="maxProfilesPerAccount">Nombre maximum de profils par compte</Label>
                  <Input
                    id="maxProfilesPerAccount"
                    name="maxProfilesPerAccount"
                    type="number"
                    min="1"
                    max="10"
                    value={platformData.maxProfilesPerAccount || ''}
                    onChange={handleNumberChange}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Limitez le nombre de profils que les utilisateurs peuvent créer (1-10)
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={platformData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de plateforme</Label>
                <div className="flex">
                  <Tag className="mr-2 h-4 w-4 mt-3 text-gray-400" />
                  <Select 
                    value={platformData.type} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Site web</Label>
                <div className="flex">
                  <Globe className="mr-2 h-4 w-4 mt-3 text-gray-400" />
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    placeholder="https://exemple.com"
                    value={platformData.websiteUrl}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Statut</Label>
              <div className="flex items-center space-x-2 mt-3">
                <Switch
                  id="isActive"
                  checked={platformData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {platformData.isActive ? 'Actif' : 'Inactif'}
                </Label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cartes cadeaux uniquement</Label>
                <p className="text-sm text-muted-foreground">
                  Cette plateforme est chargée uniquement par cartes cadeaux
                </p>
              </div>
              <Switch
                checked={platformData.hasGiftCards}
                onCheckedChange={(checked) => handleSwitchChange('hasGiftCards', checked)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offres multiples</Label>
                  <p className="text-sm text-muted-foreground">
                    Cette plateforme propose plusieurs offres fournisseur
                  </p>
                </div>
                <Switch
                  checked={platformData.hasMultipleOffers}
                  onCheckedChange={(checked) => handleSwitchChange('hasMultipleOffers', checked)}
                />
              </div>

              {platformData.hasMultipleOffers && (
                <div className="space-y-4 mt-4 border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Offres disponibles</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPlatformData(prev => ({
                          ...prev,
                          providerOffers: [
                            ...prev.providerOffers,
                            {
                              name: '',
                              price: 0,
                              deviceCount: 1,
                              currency: 'TRY',
                              isActive: true
                            }
                          ]
                        }))
                      }}
                    >
                      Ajouter une offre
                    </Button>
                  </div>

                  {platformData.providerOffers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune offre ajoutée. Cliquez sur "Ajouter une offre" pour commencer.
                    </p>
                  ) : (
                    platformData.providerOffers.map((offer, index) => (
                      <div key={index} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Offre #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setPlatformData(prev => ({
                                ...prev,
                                providerOffers: prev.providerOffers.filter((_, i) => i !== index)
                              }))
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nom de l'offre</Label>
                            <Input
                              value={offer.name}
                              onChange={(e) => {
                                setPlatformData(prev => ({
                                  ...prev,
                                  providerOffers: prev.providerOffers.map((o, i) => 
                                    i === index ? { ...o, name: e.target.value } : o
                                  )
                                }))
                              }}
                              placeholder="ex: Standard, Premium"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Prix par mois</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={offer.price}
                                onChange={(e) => {
                                  setPlatformData(prev => ({
                                    ...prev,
                                    providerOffers: prev.providerOffers.map((o, i) => 
                                      i === index ? { ...o, price: parseFloat(e.target.value) } : o
                                    )
                                  }))
                                }}
                                min="0"
                                step="0.01"
                              />
                              <Input
                                value={offer.currency}
                                onChange={(e) => {
                                  setPlatformData(prev => ({
                                    ...prev,
                                    providerOffers: prev.providerOffers.map((o, i) => 
                                      i === index ? { ...o, currency: e.target.value } : o
                                    )
                                  }))
                                }}
                                className="w-24"
                                placeholder="TRY"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Nombre d'appareils</Label>
                            <Input
                              type="number"
                              value={offer.deviceCount}
                              onChange={(e) => {
                                setPlatformData(prev => ({
                                  ...prev,
                                  providerOffers: prev.providerOffers.map((o, i) => 
                                    i === index ? { ...o, deviceCount: parseInt(e.target.value) } : o
                                  )
                                }))
                              }}
                              min="1"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <div className="flex items-center space-x-2 pt-2">
                              <Switch
                                checked={offer.isActive}
                                onCheckedChange={(checked) => {
                                  setPlatformData(prev => ({
                                    ...prev,
                                    providerOffers: prev.providerOffers.map((o, i) => 
                                      i === index ? { ...o, isActive: checked } : o
                                    )
                                  }))
                                }}
                              />
                              <Label>Actif</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/admin/streaming/platforms">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter la plateforme
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 