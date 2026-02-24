'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Key, Pencil, Loader2, Trash, User, Eye, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Platform {
  id: string
  name: string
  logo: string | null
  maxProfilesPerAccount: number | null
  hasProfiles: boolean
}

interface Account {
  id: string
  username: string | null
  platform: Platform
}

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
}

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  user: User
}

interface AccountProfile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  account: Account
  subscription: Subscription | null
}

interface ProfilesManagerProps {
  accountId: string
  profiles: AccountProfile[]
  maxProfiles: number
  onProfilesChange: () => void
}

export default function ProfilesManager({ 
  accountId, 
  profiles, 
  maxProfiles,
  onProfilesChange 
}: ProfilesManagerProps) {
  const [editingProfile, setEditingProfile] = useState<AccountProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visiblePins, setVisiblePins] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    isAssigned: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vérifier si les profils existent
  if (!profiles || profiles.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          Aucun profil disponible.
        </p>
      </div>
    )
  }

  const handleEditProfile = (profile: AccountProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name || '',
      pin: profile.pin || '',
      isAssigned: profile.isAssigned
    })
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${editingProfile.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || null,
          pin: formData.pin || null,
          isAssigned: formData.isAssigned
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour du profil')
      }

      toast.success('Profil mis à jour avec succès')
      onProfilesChange()
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!deleteProfileId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${deleteProfileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression du profil')
      }

      toast.success('Profil supprimé avec succès')
      onProfilesChange()
      setDeleteProfileId(null)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression du profil')
    } finally {
      setIsDeleting(false)
    }
  }

  const togglePinVisibility = (profileId: string) => {
    setVisiblePins(prev => {
      const newSet = new Set(prev)
      if (newSet.has(profileId)) {
        newSet.delete(profileId)
      } else {
        newSet.add(profileId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profil</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Abonnement</TableHead>
            <TableHead>PIN</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>
                <div className="space-y-1">
                  {profile.name ? (
                    <>
                      <div className="text-lg font-semibold">
                        {profile.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        P{profile.profileSlot}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-semibold">
                      P{profile.profileSlot}
                    </div>
                )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {profile.subscription?.user ? (
                    <div>
                      <div className="font-medium">
                        {profile.subscription.user.firstName && profile.subscription.user.lastName
                          ? `${profile.subscription.user.firstName} ${profile.subscription.user.lastName}`
                          : profile.subscription.user.email}
                </div>
                <div className="text-sm text-muted-foreground">
                        {profile.subscription.user.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Compte non disponible
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={profile.isAssigned ? "default" : "secondary"}>
                  {profile.isAssigned ? "Assigné" : "Non assigné"}
                </Badge>
              </TableCell>
              <TableCell>
                {profile.isAssigned && profile.subscription ? (
                  <div>
                    <Badge variant={profile.subscription.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {profile.subscription.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {profile.subscription.endDate ? (
                        `Expire le ${formatDate(profile.subscription.endDate)}`
                      ) : (
                        "Date d'expiration non définie"
                      )}
                    </div>
                  </div>
                ) : (
                  <Badge variant="secondary">Non abonné</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePinVisibility(profile.id)}
                    className="h-auto p-1 hover:bg-gray-100"
                  >
                    {visiblePins.has(profile.id) ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <span className="font-mono">
                    {visiblePins.has(profile.id) 
                      ? (profile.pin || "Non défini") 
                      : "••••"
                    }
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditProfile(profile)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteProfileId(profile.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>
              Modifiez les informations du profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du profil</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Entrez un nom pour ce profil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">Code PIN</Label>
              <Input
                id="pin"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="••••"
                maxLength={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isAssigned"
                checked={formData.isAssigned}
                onCheckedChange={(checked) => setFormData({ ...formData, isAssigned: checked })}
              />
              <Label htmlFor="isAssigned">Profil assigné</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteProfileId} onOpenChange={(open) => !open && setDeleteProfileId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le profil</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce profil ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProfileId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 