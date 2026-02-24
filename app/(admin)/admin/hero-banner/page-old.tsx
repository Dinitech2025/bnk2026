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

export default function HeroBannerAdminPage() {
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(banner)
      })

      if (response.ok) {
        const updatedBanner = await response.json()
        setBanner(updatedBanner)
        toast({
          title: 'Succès',
          description: 'Bannière mise à jour avec succès'
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration de la Bannière Principale</h1>
          <p className="text-muted-foreground">
            Personnalisez le texte, les boutons et l'image de fond de votre page d'accueil
          </p>
        </div>
        <Button onClick={() => window.open('/', '_blank')} variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Aperçu
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire de configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Contenu de la Bannière</CardTitle>
            <CardDescription>
              Modifiez le texte et les liens de votre bannière principale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre Principal</Label>
              <Input
                id="title"
                value={banner.title}
                onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                placeholder="Bienvenue chez"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={banner.subtitle}
                onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
                placeholder="Boutik'nakà"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={banner.description}
                onChange={(e) => setBanner({ ...banner, description: e.target.value })}
                placeholder="Découvrez nos produits et services..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="primaryButtonText">Bouton Principal - Texte</Label>
                <Input
                  id="primaryButtonText"
                  value={banner.primaryButtonText}
                  onChange={(e) => setBanner({ ...banner, primaryButtonText: e.target.value })}
                  placeholder="Explorer nos Produits"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primaryButtonLink">Bouton Principal - Lien</Label>
                <Input
                  id="primaryButtonLink"
                  value={banner.primaryButtonLink}
                  onChange={(e) => setBanner({ ...banner, primaryButtonLink: e.target.value })}
                  placeholder="/products"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="secondaryButtonText">Bouton Secondaire - Texte</Label>
                <Input
                  id="secondaryButtonText"
                  value={banner.secondaryButtonText}
                  onChange={(e) => setBanner({ ...banner, secondaryButtonText: e.target.value })}
                  placeholder="Découvrir nos Services"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secondaryButtonLink">Bouton Secondaire - Lien</Label>
                <Input
                  id="secondaryButtonLink"
                  value={banner.secondaryButtonLink}
                  onChange={(e) => setBanner({ ...banner, secondaryButtonLink: e.target.value })}
                  placeholder="/services"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Image de Fond par Défaut</Label>
              <p className="text-sm text-gray-500">
                Cette image sera utilisée si le diaporama est désactivé. Vous pouvez maintenant gérer plusieurs images dans la section "Diaporama d'Images de Fond" ci-dessous.
              </p>
              <Input
                value={banner.backgroundImage}
                onChange={(e) => setBanner(prev => ({ ...prev, backgroundImage: e.target.value }))}
                placeholder="URL de l'image par défaut"
              />
              {banner.backgroundImage && (
                <div className="mt-2">
                  <img 
                    src={banner.backgroundImage} 
                    alt="Image par défaut"
                    className="w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder la Bannière
            </Button>
          </CardContent>
        </Card>

        {/* Diaporama d'Images de Fond */}
        <Card>
          <CardHeader>
            <CardTitle>Diaporama d'Images de Fond</CardTitle>
            <CardDescription>
              Configurez plusieurs images qui défilent automatiquement en arrière-plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Configuration du diaporama */}
            <div className="grid gap-4">
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
                <Label htmlFor="slideshowEnabled">Activer le diaporama automatique</Label>
              </div>
              
              {banner.backgroundSlideshowEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Durée entre les images (secondes)</Label>
                      <input
                        type="range"
                        min="2"
                        max="15"
                        value={banner.backgroundSlideshowDuration / 1000}
                        onChange={(e) => setBanner(prev => ({
                          ...prev,
                          backgroundSlideshowDuration: parseInt(e.target.value) * 1000
                        }))}
                        className="w-full mt-1"
                      />
                      <span className="text-sm text-gray-500">
                        {banner.backgroundSlideshowDuration / 1000} secondes
                      </span>
                    </div>
                    
                    <div>
                      <Label>Type de transition</Label>
                      <select
                        value={banner.backgroundSlideshowTransition}
                        onChange={(e) => setBanner(prev => ({
                          ...prev,
                          backgroundSlideshowTransition: e.target.value
                        }))}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="fade">Fondu enchaîné</option>
                        <option value="slide">Glissement</option>
                        <option value="zoom">Zoom avec fondu</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Liste des images du diaporama */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Images du Diaporama</h4>
                <Button 
                  onClick={() => {
                    // Ajouter une nouvelle image
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
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une image
                </Button>
              </div>
              
              {banner.backgroundImages && banner.backgroundImages.length > 0 ? (
                <div className="grid gap-4">
                  {banner.backgroundImages.map((image, index) => (
                    <div key={image.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Image {index + 1}</h5>
                        <Button
                          onClick={() => {
                            setBanner(prev => ({
                              ...prev,
                              backgroundImages: prev.backgroundImages?.filter(img => img.id !== image.id) || []
                            }));
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Titre de l'image</Label>
                          <Input
                            value={image.title || ''}
                            onChange={(e) => {
                              const updatedImages = banner.backgroundImages?.map(img => 
                                img.id === image.id ? { ...img, title: e.target.value } : img
                              ) || [];
                              setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                            }}
                            placeholder="Ex: Commerce moderne"
                          />
                        </div>
                        
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={image.description || ''}
                            onChange={(e) => {
                              const updatedImages = banner.backgroundImages?.map(img => 
                                img.id === image.id ? { ...img, description: e.target.value } : img
                              ) || [];
                              setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                            }}
                            placeholder="Description de l'image"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>URL de l'image</Label>
                        <Input
                          value={image.imageUrl || ''}
                          onChange={(e) => {
                            const updatedImages = banner.backgroundImages?.map(img => 
                              img.id === image.id ? { ...img, imageUrl: e.target.value } : img
                            ) || [];
                            setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                          }}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      
                      {image.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={image.imageUrl} 
                            alt={image.title || `Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-4">Aucune image dans le diaporama</p>
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter la première image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options de personnalisation avancées */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation Avancée</CardTitle>
            <CardDescription>
              Configurez les couleurs, effets et apparence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Couleurs de texte */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Couleurs du Texte</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="titleColor" className="w-20">Titre</Label>
                  <Input
                    id="titleColor"
                    type="color"
                    value={banner.titleColor}
                    onChange={(e) => setBanner({ ...banner, titleColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{banner.titleColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="subtitleColor" className="w-20">Sous-titre</Label>
                  <Input
                    id="subtitleColor"
                    type="color"
                    value={banner.subtitleColor}
                    onChange={(e) => setBanner({ ...banner, subtitleColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{banner.subtitleColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="descriptionColor" className="w-20">Description</Label>
                  <Input
                    id="descriptionColor"
                    type="color"
                    value={banner.descriptionColor}
                    onChange={(e) => setBanner({ ...banner, descriptionColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{banner.descriptionColor}</span>
                </div>
              </div>
            </div>

            {/* Couleurs des boutons */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Boutons</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Label className="w-20 text-xs">Btn 1 Fond</Label>
                  <Input
                    type="color"
                    value={banner.primaryButtonBg}
                    onChange={(e) => setBanner({ ...banner, primaryButtonBg: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <Input
                    type="color"
                    value={banner.primaryButtonColor}
                    onChange={(e) => setBanner({ ...banner, primaryButtonColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-20 text-xs">Btn 2 Fond</Label>
                  <Input
                    type="color"
                    value={banner.secondaryButtonBg}
                    onChange={(e) => setBanner({ ...banner, secondaryButtonBg: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <Input
                    type="color"
                    value={banner.secondaryButtonBorder}
                    onChange={(e) => setBanner({ ...banner, secondaryButtonBorder: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Effets visuels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Effets Visuels</h4>
              <div className="space-y-3">
                <div>
                  <Label>Flou de l'image de fond: {banner.backgroundBlur}px</Label>
                  <Slider
                    value={[banner.backgroundBlur]}
                    onValueChange={(value) => setBanner({ ...banner, backgroundBlur: value[0] })}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Opacité de l'overlay: {banner.backgroundOpacity}%</Label>
                  <Slider
                    value={[banner.backgroundOpacity]}
                    onValueChange={(value) => setBanner({ ...banner, backgroundOpacity: value[0] })}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Couleur de l'overlay</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      type="color"
                      value={banner.backgroundOverlayColor}
                      onChange={(e) => setBanner({ ...banner, backgroundOverlayColor: e.target.value })}
                      className="w-20 h-10 p-1 border-2"
                    />
                    <Input
                      type="text"
                      value={banner.backgroundOverlayColor}
                      onChange={(e) => setBanner({ ...banner, backgroundOverlayColor: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBanner({ ...banner, backgroundOverlayColor: '#000000' })}
                    >
                      Noir
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBanner({ ...banner, backgroundOverlayColor: '#ffffff' })}
                    >
                      Blanc
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBanner({ ...banner, backgroundOverlayColor: '#3b82f6' })}
                    >
                      Bleu
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu de la bannière */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de la Bannière</CardTitle>
            <CardDescription>
              Voici comment votre bannière apparaîtra sur la page d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 rounded-lg overflow-hidden">
              {banner.backgroundImage && (
                <Image
                  src={banner.backgroundImage}
                  alt="Aperçu bannière"
                  fill
                  className={`object-cover ${banner.backgroundBlur > 0 ? `blur-[${banner.backgroundBlur}px]` : ''}`}
                />
              )}
              <div 
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{
                  backgroundColor: `${banner.backgroundOverlayColor}${Math.round((banner.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
                }}
              >
                <div className="text-center space-y-4">
                  <div>
                    <h2 
                      className="text-xl font-bold"
                      style={{ color: banner.titleColor }}
                    >
                      {banner.title}
                    </h2>
                    <h3 
                      className="text-2xl font-extrabold"
                      style={{ color: banner.subtitleColor }}
                    >
                      {banner.subtitle}
                    </h3>
                  </div>
                  <p 
                    className="text-sm opacity-90 max-w-md"
                    style={{ color: banner.descriptionColor }}
                  >
                    {banner.description}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      size="sm" 
                      className="border-0"
                      style={{
                        backgroundColor: banner.primaryButtonBg,
                        color: banner.primaryButtonColor
                      }}
                    >
                      {banner.primaryButtonText}
                    </Button>
                    <Button 
                      size="sm" 
                      className="border-2"
                      style={{
                        backgroundColor: banner.secondaryButtonBg,
                        color: banner.secondaryButtonColor,
                        borderColor: banner.secondaryButtonBorder
                      }}
                    >
                      {banner.secondaryButtonText}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
