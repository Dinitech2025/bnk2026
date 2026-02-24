'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, User, Key, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Platform {
  id: string
  name: string
  logo: string | null
}

interface Account {
  id: string
  username: string
  platform: Platform
  createdAt: Date
  updatedAt: Date
}

interface Profile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  account: Account
  createdAt: Date
  updatedAt: Date
}

export default function ProfileDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfileDetails()
  }, [id])

  const fetchProfileDetails = async () => {
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${id}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails du profil')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des détails du profil')
    } finally {
      setIsLoading(false)
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
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
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
          <div>
            <h1 className="text-2xl font-bold">
              Profil {profile.profileSlot}
              {profile.name && <span className="ml-2 text-gray-500">({profile.name})</span>}
            </h1>
            <p className="text-muted-foreground">
              Sur le compte {profile.account.username}
            </p>
          </div>
        </div>
        <Link href={`/admin/streaming/profiles/${profile.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du profil</CardTitle>
            <CardDescription>
              Détails du profil sur {profile.account.platform.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Nom:</span>
              <span className="ml-2">{profile.name || 'Non défini'}</span>
            </div>
            
            <div className="flex items-center">
              <Key className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Code PIN:</span>
              <span className="ml-2">{profile.pin || '••••'}</span>
            </div>

            <div>
              <span className="font-medium">Statut:</span>
              <Badge 
                variant={profile.isAssigned ? "default" : "secondary"}
                className="ml-2"
              >
                {profile.isAssigned ? "Assigné" : "Non assigné"}
              </Badge>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Créé le:</span>
              <span className="ml-2">{formatDate(profile.createdAt)}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Dernière mise à jour:</span>
              <span className="ml-2">{formatDate(profile.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>
              Détails du compte associé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Compte:</span>
              <Link 
                href={`/admin/streaming/accounts/${profile.account.id}`}
                className="ml-2 text-blue-500 hover:underline"
              >
                {profile.account.username}
              </Link>
            </div>

            <div className="flex items-center">
              <span className="font-medium">Plateforme:</span>
              <span className="ml-2">{profile.account.platform.name}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Compte créé le:</span>
              <span className="ml-2">{formatDate(profile.account.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 