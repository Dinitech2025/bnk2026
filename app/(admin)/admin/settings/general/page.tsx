'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { Switch } from '@/components/ui/switch'

interface GeneralSettings {
  siteName: string
  siteDescription: string
  siteTagline: string
  contactEmail: string
  contactPhone: string
  address: string
  logoUrl: string
  faviconUrl: string
  adminLogoUrl: string
  currency: string
  currencySymbol: string
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  youtubeUrl: string
  footerText: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  sloganMG: string
  sloganFR: string
  useSiteLogo: string
  bannerUrl: string
}

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<GeneralSettings>()

  // Pour accéder aux valeurs actuelles
  const useSiteLogo = watch('useSiteLogo')
  const logoUrl = watch('logoUrl')
  const faviconUrl = watch('faviconUrl')
  const adminLogoUrl = watch('adminLogoUrl')
  const bannerUrl = watch('bannerUrl')

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
            setValue(key as keyof GeneralSettings, value as string)
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [setValue])

  // Enregistrer les paramètres
  const onSubmit = async (data: GeneralSettings) => {
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
          description: "Les paramètres ont été enregistrés avec succès"
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres",
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
        <h1 className="text-3xl font-bold tracking-tight">Paramètres généraux</h1>
        <p className="text-muted-foreground">
          Configurez les informations générales de votre site
        </p>
      </div>
      
      <Separator />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="appearance">Apparence</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="seo">SEO & Réseaux sociaux</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du site</CardTitle>
                <CardDescription>
                  Configurez les informations de base de votre site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nom du site</Label>
                    <Input
                      id="siteName"
                      {...register('siteName', { required: 'Ce champ est requis' })}
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
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Description du site</Label>
                  <Textarea
                    id="siteDescription"
                    {...register('siteDescription')}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sloganFR">Slogan (Français)</Label>
                    <Input
                      id="sloganFR"
                      {...register('sloganFR')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sloganMG">Slogan (Malagasy)</Label>
                    <Input
                      id="sloganMG"
                      {...register('sloganMG')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Apparence</CardTitle>
                <CardDescription>
                  Configurez l'apparence visuelle de votre site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="useSiteLogo">Utiliser le logo au lieu du texte</Label>
                    <Switch
                      id="useSiteLogo"
                      checked={useSiteLogo === 'true'}
                      onCheckedChange={(checked) => {
                        setValue('useSiteLogo', checked ? 'true' : 'false')
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Activez cette option pour afficher le logo au lieu du nom du site dans l'en-tête.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo du site</Label>
                  <ImageUpload
                    value={logoUrl || ''}
                    onChange={(url) => setValue('logoUrl', url)}
                    disabled={isLoading || isSaving}
                    multiple={false}
                    variant="logo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon</Label>
                  <ImageUpload
                    value={faviconUrl || ''}
                    onChange={(url) => setValue('faviconUrl', url)}
                    disabled={isLoading || isSaving}
                    multiple={false}
                    variant="logo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Bannière</Label>
                  <ImageUpload
                    value={bannerUrl || ''}
                    onChange={(url) => setValue('bannerUrl', url)}
                    disabled={isLoading || isSaving}
                    multiple={false}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminLogoUrl">Logo admin</Label>
                  <ImageUpload
                    value={adminLogoUrl}
                    onChange={(url) => setValue('adminLogoUrl', url)}
                    disabled={isLoading || isSaving}
                    variant="logo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footerText">Texte de pied de page</Label>
                  <Textarea
                    id="footerText"
                    {...register('footerText')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
                <CardDescription>
                  Configurez les informations de contact de votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email de contact</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register('contactEmail')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Téléphone</Label>
                    <Input
                      id="contactPhone"
                      {...register('contactPhone')}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="seo" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Réseaux sociaux</CardTitle>
                <CardDescription>
                  Optimisez votre site pour les moteurs de recherche et les réseaux sociaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Titre meta (SEO)</Label>
                  <Input
                    id="metaTitle"
                    {...register('metaTitle')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Description meta</Label>
                  <Textarea
                    id="metaDescription"
                    {...register('metaDescription')}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Mots-clés</Label>
                  <Input
                    id="metaKeywords"
                    {...register('metaKeywords')}
                    placeholder="mot1, mot2, mot3..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input
                      id="facebookUrl"
                      {...register('facebookUrl')}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram</Label>
                    <Input
                      id="instagramUrl"
                      {...register('instagramUrl')}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter</Label>
                    <Input
                      id="twitterUrl"
                      {...register('twitterUrl')}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube</Label>
                    <Input
                      id="youtubeUrl"
                      {...register('youtubeUrl')}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  )
} 