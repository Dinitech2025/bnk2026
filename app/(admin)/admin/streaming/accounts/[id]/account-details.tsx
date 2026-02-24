'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Calendar, Check, Edit, Globe, Key, Loader2, User, X as XIcon, Eye, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ProfilesManager from '@/components/streaming/ProfilesManager'

interface AccountDetailsProps {
  id: string
  initialData: any
}

export function AccountDetails({ id, initialData }: AccountDetailsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState(initialData)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const fetchAccountDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/streaming/accounts/${id}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails du compte')
      const data = await response.json()
      setAccount(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/admin/streaming/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability: !account.availability
        })
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut')
      
      await fetchAccountDetails()
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du compte a été mis à jour avec succès.'
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!deleteProfileId) return

    try {
      setIsDeletingProfile(true)
      const response = await fetch(`/api/admin/streaming/accounts/${id}/profiles/${deleteProfileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression du profil')

      await fetchAccountDetails()
      setDeleteProfileId(null)
      toast({
        title: 'Profil supprimé',
        description: 'Le profil a été supprimé avec succès.'
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message
      })
    } finally {
      setIsDeletingProfile(false)
    }
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev)
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={fetchAccountDetails} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              {account.username}
              <Badge variant={account.status === 'ACTIVE' ? "success" : account.status === 'SUSPENDED' ? "destructive" : "secondary"} className="ml-3">
                {account.status === 'ACTIVE' ? 'Actif' : account.status === 'INACTIVE' ? 'Inactif' : account.status === 'SUSPENDED' ? 'Suspendu' : account.status}
              </Badge>
            </h1>
            {account.email && <p className="text-muted-foreground">{account.email}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleStatus} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : account.availability ? (
              <XIcon className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {account.availability ? "Rendre indisponible" : "Rendre disponible"}
          </Button>
          <Link href={`/admin/streaming/accounts/${id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mr-4">
                {account.platform.logo ? (
                  <Image
                    src={account.platform.logo}
                    alt={account.platform.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm">
                    {account.platform.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">{account.platform.name}</div>
                <Badge variant="outline">{account.platform.type}</Badge>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Nom d'utilisateur</span>
                </div>
                <span>{account.username}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <Key className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Mot de passe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePasswordVisibility}
                    className="h-auto p-1 hover:bg-gray-100"
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <span className="font-mono">
                    {isPasswordVisible ? account.password : "••••••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(account.password)
                      toast({
                        title: 'Copié !',
                        description: 'Le mot de passe a été copié dans le presse-papier.'
                      })
                    }}
                    className="h-6"
                  >
                    Copier
                  </Button>
                </div>
              </div>

              {account.expiresAt && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="font-medium">Date d'expiration</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant={new Date(account.expiresAt) > new Date() ? "default" : "destructive"}>
                      {new Date(account.expiresAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Date de création</span>
                </div>
                <span>{formatDate(account.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Dernière mise à jour</span>
                </div>
                <span>{formatDate(account.updatedAt)}</span>
              </div>

              {account.platform.websiteUrl && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="font-medium">Site web</span>
                  </div>
                  <a 
                    href={account.platform.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Visiter le site
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Profils ({account.accountProfiles.length}/{account.platform.hasProfiles ? (account.platform.maxProfilesPerAccount || 1) : 0})
            </CardTitle>
            <CardDescription>
              Les profils associés à ce compte sur {account.platform.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {account.accountProfiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun profil associé à ce compte
                </p>
              ) : (
                <ProfilesManager
                  accountId={account.id}
                  profiles={account.accountProfiles}
                  maxProfiles={account.platform.maxProfilesPerAccount || 1}
                  onProfilesChange={fetchAccountDetails}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!deleteProfileId} onOpenChange={(open) => !open && setDeleteProfileId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce profil ? Cette action ne peut pas être annulée.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteProfileId(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteProfile} disabled={isDeletingProfile}>
                {isDeletingProfile ? "Suppression..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 