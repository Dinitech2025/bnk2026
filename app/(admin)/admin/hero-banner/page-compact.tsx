'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Save, RefreshCw, Eye, Plus, Trash2, Settings, Image as ImageIcon, Palette } from 'lucide-react'
import Image from 'next/image'

interface HeroBannerImage {
  id: string
  imageUrl: string
  title?: string
  description?: string
  order: number
  isActive: boolean
}

interface HeroBanner {
  id?: string
  title: string
  subtitle: string
  description: string
  backgroundImage: string
  
  // Couleurs de texte
  titleColor: string
  subtitleColor: string
  descriptionColor: string
  
  // Boutons
  primaryButtonText: string
  primaryButtonLink: string
  primaryButtonColor: string
  primaryButtonBg: string
  
  secondaryButtonText: string
  secondaryButtonLink: string
  secondaryButtonColor: string
  secondaryButtonBg: string
  secondaryButtonBorder: string
  
  // Effets
  backgroundBlur: number
  backgroundOpacity: number
  backgroundOverlayColor: string
  
  // Diaporama
  backgroundSlideshowEnabled: boolean
  backgroundSlideshowDuration: number
  backgroundSlideshowTransition: string
  backgroundImages?: HeroBannerImage[]
}

export default function HeroBannerAdminPageCompact() {
  const [banner, setBanner] = useState<HeroBanner>({
    title: 'Bienvenue chez',
    subtitle: "Boutik'nakà",
    description: 'Découvrez nos produits et services de qualité exceptionnelle',
    backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    
    // Couleurs de texte
    titleColor: '#ffffff',
    subtitleColor: '#fde047',
    descriptionColor: '#ffffff',
    
    // Boutons
    primaryButtonText: 'Explorer nos Produits',
    primaryButtonLink: '/products',
    primaryButtonColor: '#ffffff',
    primaryButtonBg: '#3b82f6',
    
    secondaryButtonText: 'Découvrir nos Services',
    secondaryButtonLink: '/services',
    secondaryButtonColor: '#ffffff',
    secondaryButtonBg: 'transparent',
    secondaryButtonBorder: '#ffffff',
    
    // Effets
    backgroundBlur: 0,
    backgroundOpacity: 40,
    backgroundOverlayColor: '#000000',
    
    // Diaporama par défaut
    backgroundSlideshowEnabled: false,
    backgroundSlideshowDuration: 6000,
    backgroundSlideshowTransition: 'fade',
    backgroundImages: []
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    fetchBanner()
  }, [])

  const fetchBanner = async () => {
    try {
      const response = await fetch('/api/admin/hero-banner')
      if (response.ok) {
        const data = await response.json()
        // S'assurer que tous les champs sont définis
        setBanner({
          ...data,
          backgroundOverlayColor: data.backgroundOverlayColor || '#000000',
          backgroundSlideshowEnabled: data.backgroundSlideshowEnabled || false,
          backgroundSlideshowDuration: data.backgroundSlideshowDuration || 6000,
          backgroundSlideshowTransition: data.backgroundSlideshowTransition || 'fade',
          backgroundImages: data.backgroundImages || []
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la bannière:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la bannière',
        variant: 'destructive'
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/hero-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner)
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Bannière mise à jour avec succès'
        })
      } else {
        throw new Error('Erreur de sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la bannière',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuration de la Bannière</h1>
          <p className="text-sm text-muted-foreground">
            Gérez le contenu et l'apparence de votre bannière principale
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading} size="sm">
            {loading ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Sauvegarder
          </Button>
          <Button onClick={() => window.open('/', '_blank')} variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Aperçu
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contenu" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contenu" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            Contenu
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1 text-xs">
            <ImageIcon className="h-3 w-3" />
            Images
          </TabsTrigger>
          <TabsTrigger value="styles" className="flex items-center gap-1 text-xs">
            <Palette className="h-3 w-3" />
            Styles
          </TabsTrigger>
          <TabsTrigger value="apercu" className="flex items-center gap-1 text-xs">
            <Eye className="h-3 w-3" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        {/* Onglet Contenu */}
        <TabsContent value="contenu">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Textes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <Input
                      value={banner.title}
                      onChange={(e) => setBanner(prev => ({ ...prev, title: e.target.value }))}
                      className="h-7 text-xs"
                      placeholder="Bienvenue chez"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sous-titre</Label>
                    <Input
                      value={banner.subtitle}
                      onChange={(e) => setBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="h-7 text-xs"
                      placeholder="Boutik'nakà"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={banner.description}
                    onChange={(e) => setBanner(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="text-xs"
                    placeholder="Description..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Boutons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Bouton 1</Label>
                    <Input
                      value={banner.primaryButtonText}
                      onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lien</Label>
                    <Input
                      value={banner.primaryButtonLink}
                      onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonLink: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Bouton 2</Label>
                    <Input
                      value={banner.secondaryButtonText}
                      onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lien</Label>
                    <Input
                      value={banner.secondaryButtonLink}
                      onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonLink: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Images */}
        <TabsContent value="images">
          <div className="grid gap-3 lg:grid-cols-4">
            {/* Configuration du diaporama */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Config Diaporama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="slideshowEnabled"
                    checked={banner.backgroundSlideshowEnabled}
                    onChange={(e) => setBanner(prev => ({
                      ...prev,
                      backgroundSlideshowEnabled: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="slideshowEnabled" className="text-xs">Auto</Label>
                </div>
                
                {banner.backgroundSlideshowEnabled && (
                  <>
                    <div>
                      <Label className="text-xs">Durée: {banner.backgroundSlideshowDuration / 1000}s</Label>
                      <input
                        type="range"
                        min="2"
                        max="15"
                        value={banner.backgroundSlideshowDuration / 1000}
                        onChange={(e) => setBanner(prev => ({
                          ...prev,
                          backgroundSlideshowDuration: parseInt(e.target.value) * 1000
                        }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Transition</Label>
                      <select
                        value={banner.backgroundSlideshowTransition}
                        onChange={(e) => setBanner(prev => ({
                          ...prev,
                          backgroundSlideshowTransition: e.target.value
                        }))}
                        className="w-full p-1 text-xs border rounded h-6"
                      >
                        <option value="fade">Fondu</option>
                        <option value="slide">Glissement</option>
                        <option value="zoom">Zoom</option>
                      </select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Images du diaporama */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Images ({banner.backgroundImages?.length || 0})</CardTitle>
                <Button 
                  onClick={() => {
                    const newImage = {
                      id: `temp-${Date.now()}`,
                      imageUrl: '',
                      title: `Image ${(banner.backgroundImages?.length || 0) + 1}`,
                      description: '',
                      order: (banner.backgroundImages?.length || 0) + 1,
                      isActive: true
                    };
                    setBanner(prev => ({
                      ...prev,
                      backgroundImages: [...(prev.backgroundImages || []), newImage]
                    }));
                  }}
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent className="p-3">
                {banner.backgroundImages && banner.backgroundImages.length > 0 ? (
                  <div className="grid gap-2 max-h-80 overflow-y-auto">
                    {banner.backgroundImages.map((image, index) => (
                      <div key={image.id} className="border rounded p-2 bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">#{index + 1}</span>
                          <Button
                            onClick={() => {
                              setBanner(prev => ({
                                ...prev,
                                backgroundImages: prev.backgroundImages?.filter(img => img.id !== image.id) || []
                              }));
                            }}
                            size="sm"
                            variant="destructive"
                            className="h-5 w-5 p-0"
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1">
                          <Input
                            value={image.title || ''}
                            onChange={(e) => {
                              const updatedImages = banner.backgroundImages?.map(img => 
                                img.id === image.id ? { ...img, title: e.target.value } : img
                              ) || [];
                              setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                            }}
                            placeholder="Titre"
                            className="h-6 text-xs"
                          />
                          <Input
                            value={image.description || ''}
                            onChange={(e) => {
                              const updatedImages = banner.backgroundImages?.map(img => 
                                img.id === image.id ? { ...img, description: e.target.value } : img
                              ) || [];
                              setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                            }}
                            placeholder="Description"
                            className="h-6 text-xs"
                          />
                        </div>
                        
                        <Input
                          value={image.imageUrl || ''}
                          onChange={(e) => {
                            const updatedImages = banner.backgroundImages?.map(img => 
                              img.id === image.id ? { ...img, imageUrl: e.target.value } : img
                            ) || [];
                            setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                          }}
                          placeholder="URL de l'image"
                          className="h-6 text-xs"
                        />
                        
                        {image.imageUrl && (
                          <img 
                            src={image.imageUrl} 
                            alt={image.title || `Image ${index + 1}`}
                            className="w-full h-16 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded">
                    <p className="text-xs text-gray-500 mb-2">Aucune image</p>
                    <Button 
                      onClick={() => {
                        const newImage = {
                          id: `temp-${Date.now()}`,
                          imageUrl: '',
                          title: 'Image 1',
                          description: '',
                          order: 1,
                          isActive: true
                        };
                        setBanner(prev => ({
                          ...prev,
                          backgroundImages: [newImage]
                        }));
                      }}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Première image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Styles */}
        <TabsContent value="styles">
          <div className="grid gap-3 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Couleurs Texte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={banner.titleColor}
                        onChange={(e) => setBanner(prev => ({ ...prev, titleColor: e.target.value }))}
                        className="w-6 h-6 rounded border"
                      />
                      <Input
                        value={banner.titleColor}
                        onChange={(e) => setBanner(prev => ({ ...prev, titleColor: e.target.value }))}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Sous-titre</Label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={banner.subtitleColor}
                        onChange={(e) => setBanner(prev => ({ ...prev, subtitleColor: e.target.value }))}
                        className="w-6 h-6 rounded border"
                      />
                      <Input
                        value={banner.subtitleColor}
                        onChange={(e) => setBanner(prev => ({ ...prev, subtitleColor: e.target.value }))}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Couleurs Boutons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Bouton 1</Label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={banner.primaryButtonBg}
                        onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonBg: e.target.value }))}
                        className="w-6 h-6 rounded border"
                      />
                      <Input
                        value={banner.primaryButtonBg}
                        onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonBg: e.target.value }))}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Bouton 2</Label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={banner.secondaryButtonBg}
                        onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonBg: e.target.value }))}
                        className="w-6 h-6 rounded border"
                      />
                      <Input
                        value={banner.secondaryButtonBg}
                        onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonBg: e.target.value }))}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Effets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs">Flou: {banner.backgroundBlur}px</Label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={banner.backgroundBlur}
                    onChange={(e) => setBanner(prev => ({ ...prev, backgroundBlur: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-xs">Opacité: {banner.backgroundOpacity}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={banner.backgroundOpacity}
                    onChange={(e) => setBanner(prev => ({ ...prev, backgroundOpacity: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Aperçu */}
        <TabsContent value="apercu">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aperçu de la Bannière</CardTitle>
              <CardDescription className="text-xs">
                Voici comment votre bannière apparaîtra sur la page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden border">
                {banner.backgroundImage && (
                  <Image 
                    src={banner.backgroundImage}
                    alt="Aperçu"
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: banner.titleColor }}>
                      {banner.title}
                    </h1>
                    <h2 className="text-xl mb-3" style={{ color: banner.subtitleColor }}>
                      {banner.subtitle}
                    </h2>
                    <p className="text-sm mb-4" style={{ color: banner.descriptionColor }}>
                      {banner.description}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button 
                        className="px-3 py-1 text-xs rounded"
                        style={{ 
                          backgroundColor: banner.primaryButtonBg,
                          color: banner.primaryButtonColor
                        }}
                      >
                        {banner.primaryButtonText}
                      </button>
                      <button 
                        className="px-3 py-1 text-xs rounded border"
                        style={{ 
                          backgroundColor: banner.secondaryButtonBg,
                          color: banner.secondaryButtonColor,
                          borderColor: banner.secondaryButtonBorder
                        }}
                      >
                        {banner.secondaryButtonText}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
