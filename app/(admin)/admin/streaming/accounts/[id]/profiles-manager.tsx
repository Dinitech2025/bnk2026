'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Pencil, Save, Trash2, X } from 'lucide-react'

interface Profile {
  id: string
  name: string
  profileSlot: number
  isAssigned: boolean
}

interface ProfilesManagerProps {
  accountId: string
  profiles: Profile[]
  maxProfiles: number
  onProfilesChange: () => void
}

export function ProfilesManager({ accountId, profiles, maxProfiles, onProfilesChange }: ProfilesManagerProps) {
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editedName, setEditedName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEditProfile = (profile: Profile) => {
    setEditingProfileId(profile.id)
    setEditedName(profile.name || '')
  }

  const handleCancelEdit = () => {
    setEditingProfileId(null)
    setEditedName('')
  }

  const handleSaveProfile = async (profileId: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/admin/streaming/accounts/${accountId}/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName })
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du profil')

      toast({
        title: 'Profil mis à jour',
        description: 'Le nom du profil a été mis à jour avec succès.'
      })

      onProfilesChange()
      setEditingProfileId(null)
      setEditedName('')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center space-x-4">
            {editingProfileId === profile.id ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Nom du profil"
                  className="w-48"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveProfile(profile.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="font-medium">
                  {profile.name || `Profil ${profile.profileSlot}`}
                </span>
                <Badge variant={profile.isAssigned ? "secondary" : "default"}>
                  {profile.isAssigned ? "Assigné" : "Disponible"}
                </Badge>
              </>
            )}
          </div>
          
          {editingProfileId !== profile.id && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditProfile(profile)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => onProfilesChange()}
                disabled={profile.isAssigned}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 