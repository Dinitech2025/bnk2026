'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { X, User, Users, Crown, Zap, CheckCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'

interface Platform {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface Account {
  id: string
  email: string
  username: string
  status: string
  maxProfiles: number
  currentProfiles: number
  availableProfiles: number
  platform: Platform
}

interface Profile {
  id: string
  name: string
  isUsed: boolean
  accountId: string
}

interface Offer {
  id: string
  name: string
  description: string | null
  price: string
  durationText: string
  maxProfiles: number
  features: string | null
  platform: Platform
  platforms: Platform[]
}

interface SubscriptionPopupProps {
  offer: Offer | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (reservationData: any) => void
}

export function SubscriptionPopup({ offer, isOpen, onClose, onAddToCart }: SubscriptionPopupProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [autoSelected, setAutoSelected] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<'checking' | 'available' | 'limited' | 'unavailable'>('checking')

  useEffect(() => {
    if (isOpen && offer) {
      fetchAccountsAndProfiles()
      setAutoSelected(false)
    }
  }, [isOpen, offer])

  // Fonction pour trouver le compte optimal
  const findOptimalAccount = (accounts: Account[], requiredProfiles: number): Account | null => {
    if (accounts.length === 0) return null

    // Filtrer les comptes qui ont assez de profils disponibles
    const eligibleAccounts = accounts.filter(acc => acc.availableProfiles >= requiredProfiles)
    
    if (eligibleAccounts.length === 0) return null

    // Trier par pertinence :
    // 1. Priorité aux comptes avec le nombre de profils libres le plus proche (mais >= requis)
    // 2. En cas d'égalité, privilégier le compte avec le moins de profils totaux (optimisation)
    const sortedAccounts = eligibleAccounts.sort((a, b) => {
      const diffA = a.availableProfiles - requiredProfiles
      const diffB = b.availableProfiles - requiredProfiles
      
      if (diffA !== diffB) {
        return diffA - diffB // Plus proche = meilleur
      }
      
      // En cas d'égalité, privilégier le compte avec moins de profils totaux
      return a.maxProfiles - b.maxProfiles
    })

    return sortedAccounts[0]
  }

  // Fonction pour sélectionner automatiquement les meilleurs profils
  const selectOptimalProfiles = (profiles: Profile[], requiredCount: number): string[] => {
    const availableProfiles = profiles.filter(profile => !profile.isUsed)
    
    if (availableProfiles.length < requiredCount) return []

    // Trier les profils par slot (priorité au profil principal)
    const sortedProfiles = availableProfiles.sort((a, b) => {
      // Le profil "Principal" en premier
      if (a.name.toLowerCase().includes('principal')) return -1
      if (b.name.toLowerCase().includes('principal')) return 1
      
      // Sinon par ordre de slot
      return (a as any).profileSlot - (b as any).profileSlot
    })

    return sortedProfiles.slice(0, requiredCount).map(p => p.id)
  }

  // Fonction pour effectuer la sélection automatique
  const performAutoSelection = async (accountsData: Account[]) => {
    if (!offer || autoSelected) return

    const optimalAccount = findOptimalAccount(accountsData, offer.maxProfiles)
    
    if (optimalAccount) {
      console.log('🎯 Compte optimal sélectionné automatiquement')
      setSelectedAccount(optimalAccount.id)
      
      // Charger les profils de ce compte
      try {
        const profilesResponse = await fetch(`/api/admin/streaming/profiles?accountId=${optimalAccount.id}`)
        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json()
          setProfiles(profilesData)
          
          // Sélectionner automatiquement les meilleurs profils
          const optimalProfiles = selectOptimalProfiles(profilesData, offer.maxProfiles)
          setSelectedProfiles(optimalProfiles)
          
          console.log('👤 Profils optimaux sélectionnés automatiquement')
          setAutoSelected(true)
          setAvailabilityStatus('available')
          
          toast({
            title: "Sélection automatique",
            description: `Abonnement ${offer.platform.name} disponible avec ${optimalProfiles.length} profil${optimalProfiles.length > 1 ? 's' : ''}`,
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des profils:', error)
        setAvailabilityStatus('unavailable')
      }
    } else {
      setAvailabilityStatus('unavailable')
      toast({
        title: "Indisponible",
        description: "Cet abonnement n'est pas disponible actuellement",
        variant: "destructive"
      })
    }
  }

  const fetchAccountsAndProfiles = async () => {
    if (!offer) return
    
    setLoading(true)
    setAvailabilityStatus('checking')
    try {
      // Récupérer les comptes disponibles pour la plateforme
      const accountsResponse = await fetch(`/api/admin/streaming/accounts?platformId=${offer.platform.id}`)
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        console.log('Vérification de la disponibilité...')
        setAccounts(accountsData)
        
        // Effectuer la sélection automatique
        await performAutoSelection(accountsData)
      } else {
        console.error('Erreur API comptes:', accountsResponse.status)
        setAvailabilityStatus('unavailable')
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
      setAvailabilityStatus('unavailable')
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la disponibilité",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!offer || !selectedAccount || selectedProfiles.length === 0) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez attendre la sélection automatique",
        variant: "destructive"
      })
      return
    }

    const selectedAccountData = accounts.find(acc => acc.id === selectedAccount)
    const selectedProfilesData = profiles.filter(profile => selectedProfiles.includes(profile.id))

    const reservationData = {
      type: 'subscription',
      offerId: offer.id,
      offerName: offer.name,
      platform: offer.platform,
      price: offer.price,
      duration: offer.durationText,
      maxProfiles: offer.maxProfiles,
      // Masquer les détails du compte pour la sécurité
      account: {
        id: selectedAccountData?.id,
        available: true
      },
      profiles: selectedProfilesData.map(p => ({
        id: p.id,
        reserved: true
      })),
      reservedAt: new Date().toISOString(),
      autoSelected: autoSelected
    }

    onAddToCart(reservationData)
    
    // Reset et fermer
    setSelectedAccount('')
    setSelectedProfiles([])
    setAutoSelected(false)
    setAvailabilityStatus('checking')
    onClose()

    toast({
      title: "Ajouté au panier",
      description: `${offer.name} avec ${selectedProfiles.length} profil${selectedProfiles.length > 1 ? 's' : ''} réservé${selectedProfiles.length > 1 ? 's' : ''}`,
    })
  }

  const features = offer?.features ? JSON.parse(offer.features) : []

  if (!isOpen || !offer) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-4">
            {offer.platform.logo && (
              <div className="w-12 h-12 relative">
                <Image
                  src={offer.platform.logo}
                  alt={offer.platform.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{offer.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{offer.platform.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Détails de l'offre */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {Number(offer.price).toLocaleString()} Ar
              </span>
              <Badge variant="secondary">{offer.durationText}</Badge>
            </div>
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}
          </div>

          {/* Fonctionnalités */}
          {features.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Fonctionnalités incluses :</h4>
              <div className="grid grid-cols-1 gap-1">
                {features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statut de disponibilité */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">Disponibilité de l'abonnement</h4>
                <p className="text-sm text-slate-600 mt-1">
                  {loading && availabilityStatus === 'checking' && "Vérification en cours..."}
                  {availabilityStatus === 'available' && `Disponible avec ${offer.maxProfiles} profil${offer.maxProfiles > 1 ? 's' : ''}`}
                  {availabilityStatus === 'limited' && "Disponibilité limitée"}
                  {availabilityStatus === 'unavailable' && "Actuellement indisponible"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {loading && availabilityStatus === 'checking' && (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                )}
                {availabilityStatus === 'available' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {availabilityStatus === 'unavailable' && (
                  <X className="w-5 h-5 text-red-500" />
                )}
                {autoSelected && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </div>
            
            {autoSelected && availabilityStatus === 'available' && (
              <div className="mt-3 text-xs text-green-700 bg-green-50 p-2 rounded">
                ✨ Sélection optimale effectuée automatiquement
              </div>
            )}
          </div>

          {/* Informations sur les profils */}
          {availabilityStatus === 'available' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    {offer.maxProfiles} profil{offer.maxProfiles > 1 ? 's' : ''} inclus
                  </h4>
                  <p className="text-sm text-blue-700">
                    Profils prêts à être configurés après paiement
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note de sécurité */}
          <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded">
            🔒 Les détails du compte seront fournis après confirmation du paiement
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddToCart}
            disabled={availabilityStatus !== 'available' || loading}
            className="min-w-[120px]"
          >
            {loading ? 'Vérification...' : 'Ajouter au panier'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 