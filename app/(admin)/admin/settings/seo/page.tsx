'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Search, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

interface SeoSettings {
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  youtubeUrl: string
}

export default function SeoSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SeoSettings>()

  // Charger les paramètres existants
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/settings/general')
        if (response.ok) {
          const data = await response.json()
          
          // Remplir le formulaire avec les données existantes
          Object.entries(data).forEach(([key, value]) => {
            if (key in { metaTitle: '', metaDescription: '', metaKeywords: '', facebookUrl: '', instagramUrl: '', twitterUrl: '', youtubeUrl: '' }) {
              setValue(key as keyof SeoSettings, value as string)
            }
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres SEO",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [setValue])

  // Enregistrer les paramètres
  const onSubmit = async (data: SeoSettings) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Les paramètres SEO ont été enregistrés avec succès"
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres SEO",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres SEO & Réseaux sociaux</h1>
        <p className="text-muted-foreground">
          Optimisez votre site pour les moteurs de recherche et les réseaux sociaux
        </p>
      </div>
      
      <Separator />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Optimisation SEO
            </CardTitle>
            <CardDescription>
              Configurez les métadonnées pour améliorer le référencement de votre site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Titre meta (SEO)</Label>
              <Input
                id="metaTitle"
                {...register('metaTitle', {
                  maxLength: {
                    value: 60,
                    message: 'Le titre ne doit pas dépasser 60 caractères'
                  }
                })}
                placeholder="Mon Site Web - Description courte"
              />
              {errors.metaTitle && (
                <p className="text-sm text-red-500">{errors.metaTitle.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Titre affiché dans les résultats de recherche (max 60 caractères)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Description meta</Label>
              <Textarea
                id="metaDescription"
                {...register('metaDescription', {
                  maxLength: {
                    value: 160,
                    message: 'La description ne doit pas dépasser 160 caractères'
                  }
                })}
                rows={3}
                placeholder="Description de votre site web qui apparaîtra dans les résultats de recherche..."
              />
              {errors.metaDescription && (
                <p className="text-sm text-red-500">{errors.metaDescription.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Description affichée dans les résultats de recherche (max 160 caractères)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaKeywords">Mots-clés</Label>
              <Input
                id="metaKeywords"
                {...register('metaKeywords')}
                placeholder="mot-clé1, mot-clé2, mot-clé3..."
              />
              <p className="text-sm text-muted-foreground">
                Mots-clés séparés par des virgules (optionnel, peu utilisé par les moteurs de recherche modernes)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Réseaux sociaux</CardTitle>
            <CardDescription>
              Liens vers vos profils de réseaux sociaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Label>
                <Input
                  id="facebookUrl"
                  {...register('facebookUrl', {
                    pattern: {
                      value: /^https?:\/\/(www\.)?facebook\.com\/.+/i,
                      message: 'URL Facebook invalide'
                    }
                  })}
                  placeholder="https://facebook.com/monentreprise"
                />
                {errors.facebookUrl && (
                  <p className="text-sm text-red-500">{errors.facebookUrl.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Instagram
                </Label>
                <Input
                  id="instagramUrl"
                  {...register('instagramUrl', {
                    pattern: {
                      value: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
                      message: 'URL Instagram invalide'
                    }
                  })}
                  placeholder="https://instagram.com/monentreprise"
                />
                {errors.instagramUrl && (
                  <p className="text-sm text-red-500">{errors.instagramUrl.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitterUrl" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-blue-400" />
                  Twitter / X
                </Label>
                <Input
                  id="twitterUrl"
                  {...register('twitterUrl', {
                    pattern: {
                      value: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
                      message: 'URL Twitter/X invalide'
                    }
                  })}
                  placeholder="https://twitter.com/monentreprise"
                />
                {errors.twitterUrl && (
                  <p className="text-sm text-red-500">{errors.twitterUrl.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-600" />
                  YouTube
                </Label>
                <Input
                  id="youtubeUrl"
                  {...register('youtubeUrl', {
                    pattern: {
                      value: /^https?:\/\/(www\.)?youtube\.com\/.+/i,
                      message: 'URL YouTube invalide'
                    }
                  })}
                  placeholder="https://youtube.com/c/monentreprise"
                />
                {errors.youtubeUrl && (
                  <p className="text-sm text-red-500">{errors.youtubeUrl.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 