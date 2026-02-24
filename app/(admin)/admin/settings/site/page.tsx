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
import { Loader2, Save } from 'lucide-react'

interface SiteSettings {
  siteName: string
  siteDescription: string
  siteTagline: string
  currency: string
  currencySymbol: string
  sloganMG: string
  sloganFR: string
}

export default function SiteSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SiteSettings>()

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
            if (key in { siteName: '', siteDescription: '', siteTagline: '', currency: '', currencySymbol: '', sloganMG: '', sloganFR: '' }) {
              setValue(key as keyof SiteSettings, value as string)
            }
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres du site",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [setValue])

  // Enregistrer les paramètres
  const onSubmit = async (data: SiteSettings) => {
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
          description: "Les paramètres du site ont été enregistrés avec succès"
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres du site",
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
        <h1 className="text-3xl font-bold tracking-tight">Paramètres du site</h1>
        <p className="text-muted-foreground">
          Configurez les informations générales de votre site
        </p>
      </div>
      
      <Separator />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du site</CardTitle>
            <CardDescription>
              Configurez les informations de base de votre site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du site *</Label>
                <Input
                  id="siteName"
                  {...register('siteName', { required: 'Ce champ est requis' })}
                  placeholder="Mon Site Web"
                />
                {errors.siteName && (
                  <p className="text-sm text-red-500">{errors.siteName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteTagline">Slogan</Label>
                <Input
                  id="siteTagline"
                  {...register('siteTagline')}
                  placeholder="Votre slogan ici"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Description du site</Label>
              <Textarea
                id="siteDescription"
                {...register('siteDescription')}
                rows={3}
                placeholder="Description de votre site web..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  {...register('currency')}
                  placeholder="EUR, USD, MGA..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Symbole de devise</Label>
                <Input
                  id="currencySymbol"
                  {...register('currencySymbol')}
                  placeholder="€, $, Ar..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sloganFR">Slogan (Français)</Label>
                <Input
                  id="sloganFR"
                  {...register('sloganFR')}
                  placeholder="Slogan en français"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sloganMG">Slogan (Malagasy)</Label>
                <Input
                  id="sloganMG"
                  {...register('sloganMG')}
                  placeholder="Slogan en malagasy"
                />
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