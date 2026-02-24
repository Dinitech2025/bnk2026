'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface Profile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
}

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    pin: '',
    isAssigned: false
  })

  useEffect(() => {
    fetchProfileDetails()
  }, [id])

  const fetchProfileDetails = async () => {
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${id}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails du profil')
      const data = await response.json()
      setProfile(data)
      setFormData({
        pin: data.pin || '',
        isAssigned: data.isAssigned
      })
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des détails du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: formData.pin || null,
          isAssigned: formData.isAssigned
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour du profil')
      }
      
      toast.success('Profil mis à jour avec succès')
      router.push(`/admin/streaming/profiles/${id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil')
    } finally {
      setIsSaving(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchProfileDetails}
            className="mt-4"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !profile) {
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
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

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
        <div>
          <h1 className="text-2xl font-bold">
            Modifier le profil {profile.profileSlot}
          </h1>
          {profile.name && (
            <p className="text-muted-foreground">
              {profile.name}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du profil</CardTitle>
            <CardDescription>
              Modifier les informations du profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Code PIN</Label>
              <Input
                id="pin"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Entrez un code PIN (optionnel)"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <p className="text-sm text-muted-foreground">
                Laissez vide pour supprimer le code PIN
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAssigned"
                checked={formData.isAssigned}
                onCheckedChange={(checked) => setFormData({ ...formData, isAssigned: checked })}
              />
              <Label htmlFor="isAssigned">Profil assigné</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 