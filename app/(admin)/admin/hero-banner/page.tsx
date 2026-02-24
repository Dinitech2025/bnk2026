'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { 
  Save, RefreshCw, Eye, Plus, Trash2, Settings, Image as ImageIcon, 
  Palette, Upload, GripVertical, Monitor, Smartphone, Tablet,
  RotateCcw, Copy, Zap, Timer, Shuffle
} from 'lucide-react'
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
  
  // Diaporama d'images de fond
  backgroundSlideshowEnabled: boolean
  backgroundSlideshowDuration: number
  backgroundSlideshowTransition: string
  backgroundImages: HeroBannerImage[]
}

export default function HeroBannerAdmin() {
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
  const [uploading, setUploading] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    fetchBanner()
  }, [])

  // Gestion de l'auto-slideshow pour l'aperçu
  useEffect(() => {
    if (!banner.backgroundSlideshowEnabled || !banner.backgroundImages || banner.backgroundImages.length <= 1) {
      return
    }

    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => 
        prev >= banner.backgroundImages!.length - 1 ? 0 : prev + 1
      )
    }, banner.backgroundSlideshowDuration)

    return () => clearInterval(interval)
  }, [banner.backgroundSlideshowEnabled, banner.backgroundImages, banner.backgroundSlideshowDuration])

  // Reset du slide index quand les images changent
  useEffect(() => {
    setCurrentSlideIndex(0)
  }, [banner.backgroundImages])

  const fetchBanner = async () => {
    try {
      const response = await fetch('/api/admin/hero-banner')
      if (response.ok) {
        const data = await response.json()
        setBanner(prev => ({
          ...prev,
          ...data,
          backgroundOverlayColor: data.backgroundOverlayColor || '#000000',
          backgroundImages: data.backgroundImages || []
        }))
      }
    } catch (error) {
      console.error('Erreur:', error)
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
        description: 'Impossible de sauvegarder',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour uploader une image
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload')
    }

    const data = await response.json()
    return data.url
  }

  // Gérer l'upload d'image pour le background principal
  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading('background')
    try {
      const imageUrl = await uploadImage(file)
      setBanner(prev => ({ ...prev, backgroundImage: imageUrl }))
      toast({
        title: 'Succès',
        description: 'Image de fond mise à jour'
      })
    } catch (error) {
      console.error('Erreur upload:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive'
      })
    } finally {
      setUploading(null)
    }
  }

  // Gérer l'upload d'image pour le diaporama
  const handleSlideshowImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(imageId)
    try {
      const imageUrl = await uploadImage(file)
      const updatedImages = banner.backgroundImages?.map(img => 
        img.id === imageId ? { ...img, imageUrl } : img
      ) || []
      setBanner(prev => ({ ...prev, backgroundImages: updatedImages }))
      toast({
        title: 'Succès',
        description: 'Image du diaporama mise à jour'
      })
    } catch (error) {
      console.error('Erreur upload:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive'
      })
    } finally {
      setUploading(null)
    }
  }

  // Fonctions de drag & drop
  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedItem(imageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetImageId) {
      setDraggedItem(null)
      return
    }

    const images = banner.backgroundImages || []
    const draggedIndex = images.findIndex(img => img.id === draggedItem)
    const targetIndex = images.findIndex(img => img.id === targetImageId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      return
    }

    // Réorganiser les images
    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(targetIndex, 0, draggedImage)

    // Mettre à jour les ordres
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      order: index + 1
    }))

    setBanner(prev => ({
      ...prev,
      backgroundImages: updatedImages
    }))

    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const getPreviewClasses = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto h-64'
      case 'tablet':
        return 'max-w-2xl mx-auto h-80'
      default:
        return 'w-full h-96'
    }
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Chargement de la configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion de la Bannière</h1>
              <p className="text-gray-600 mt-1">
                Personnalisez l'apparence de votre bannière d'accueil
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Sauvegarder
              </Button>
              <Button onClick={() => window.open('/', '_blank')} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          
          {/* Aperçu en temps réel */}
          <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Aperçu en Temps Réel
                    </CardTitle>
                    <CardDescription>
                      Prévisualisez vos modifications instantanément
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${getPreviewClasses()}`}>
                  {/* Diaporama d'images de fond */}
                  {banner.backgroundSlideshowEnabled && banner.backgroundImages && banner.backgroundImages.length > 0 ? (
                    <div className="absolute inset-0">
                      {banner.backgroundImages.map((image, index) => (
                        <div
                          key={image.id}
                          className={`absolute inset-0 transition-all duration-1000 ${
                            banner.backgroundSlideshowTransition === 'fade' 
                              ? `${index === currentSlideIndex ? 'opacity-100' : 'opacity-0'}`
                              : banner.backgroundSlideshowTransition === 'slide'
                              ? `transform ${index === currentSlideIndex ? 'translate-x-0' : index < currentSlideIndex ? '-translate-x-full' : 'translate-x-full'}`
                              : banner.backgroundSlideshowTransition === 'zoom'
                              ? `transition-all duration-1000 ${index === currentSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`
                              : `${index === currentSlideIndex ? 'opacity-100' : 'opacity-0'}`
                          }`}
                        >
                          {image.imageUrl && (
                            <Image
                              src={image.imageUrl}
                              alt={image.title || `Image ${index + 1}`}
                              fill
                              className={`object-cover ${banner.backgroundBlur > 0 ? `blur-[${banner.backgroundBlur}px]` : ''}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Image de fond par défaut */
                    banner.backgroundImage && (
                      <Image
                        src={banner.backgroundImage}
                        alt="Image de fond"
                        fill
                        className={`object-cover ${banner.backgroundBlur > 0 ? `blur-[${banner.backgroundBlur}px]` : ''}`}
                      />
                    )
                  )}
                  
                  {/* Overlay avec couleur et opacité personnalisées */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundColor: `${banner.backgroundOverlayColor}${Math.round((banner.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
                    }}
                  />
                  
                  {/* Contenu de la bannière */}
                  <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                    <div className="space-y-4 max-w-lg">
                      <h1 
                        className="text-4xl font-bold leading-tight"
                        style={{ color: banner.titleColor }}
                      >
                        {banner.title}
                      </h1>
                      <h2 
                        className="text-5xl font-extrabold"
                        style={{ color: banner.subtitleColor }}
                      >
                        {banner.subtitle}
                      </h2>
                      <p 
                        className="text-lg opacity-90"
                        style={{ color: banner.descriptionColor }}
                      >
                        {banner.description}
                      </p>
                      <div className="flex gap-4 justify-center pt-4">
                        <button 
                          className="px-8 py-3 rounded-lg font-semibold transition-colors"
                          style={{
                            backgroundColor: banner.primaryButtonBg,
                            color: banner.primaryButtonColor
                          }}
                        >
                          {banner.primaryButtonText}
                        </button>
                        <button 
                          className="px-8 py-3 rounded-lg font-semibold border-2 transition-colors"
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

                  {/* Indicateurs du diaporama */}
                  {banner.backgroundSlideshowEnabled && banner.backgroundImages && banner.backgroundImages.length > 1 && (
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {banner.backgroundImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                            index === currentSlideIndex ? 'bg-white scale-125' : 'bg-white/50'
                          }`}
                          onClick={() => setCurrentSlideIndex(index)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Compteur d'images */}
                  {banner.backgroundSlideshowEnabled && banner.backgroundImages && banner.backgroundImages.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                      {currentSlideIndex + 1}/{banner.backgroundImages.length}
                    </div>
                  )}
                </div>

                {/* Statistiques du diaporama */}
                {banner.backgroundSlideshowEnabled && banner.backgroundImages && banner.backgroundImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{banner.backgroundImages.length}</div>
                      <div className="text-sm text-gray-600">Images</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{banner.backgroundSlideshowDuration / 1000}s</div>
                      <div className="text-sm text-gray-600">Durée</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-600 capitalize">{banner.backgroundSlideshowTransition}</div>
                      <div className="text-sm text-gray-600">Transition</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Panneau de configuration */}
          <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 max-w-2xl mx-auto">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Contenu</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Images</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Couleurs</span>
                </TabsTrigger>
                <TabsTrigger value="effects" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Effets</span>
                </TabsTrigger>
              </TabsList>

              {/* Onglet Contenu */}
              <TabsContent value="content" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Textes de la Bannière</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Titre Principal</Label>
                      <Input
                        value={banner.title}
                        onChange={(e) => setBanner(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Bienvenue chez"
                      />
                    </div>
                    <div>
                      <Label>Sous-titre</Label>
                      <Input
                        value={banner.subtitle}
                        onChange={(e) => setBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Boutik'nakà"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={banner.description}
                        onChange={(e) => setBanner(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Description de votre boutique..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Boutons d'Action</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bouton Principal</Label>
                        <Input
                          value={banner.primaryButtonText}
                          onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                          placeholder="Explorer nos Produits"
                        />
                      </div>
                      <div>
                        <Label>Lien</Label>
                        <Input
                          value={banner.primaryButtonLink}
                          onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonLink: e.target.value }))}
                          placeholder="/products"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bouton Secondaire</Label>
                        <Input
                          value={banner.secondaryButtonText}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                          placeholder="Découvrir nos Services"
                        />
                      </div>
                      <div>
                        <Label>Lien</Label>
                        <Input
                          value={banner.secondaryButtonLink}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonLink: e.target.value }))}
                          placeholder="/services"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>

              {/* Onglet Images */}
              <TabsContent value="images" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shuffle className="h-5 w-5" />
                      Diaporama Automatique
                    </CardTitle>
                    <CardDescription>
                      Configurez un diaporama avec plusieurs images de fond
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Activer le Diaporama</Label>
                        <p className="text-sm text-gray-500">Change automatiquement les images de fond</p>
                      </div>
                      <Switch
                        checked={banner.backgroundSlideshowEnabled}
                        onCheckedChange={(checked) => setBanner(prev => ({
                          ...prev,
                          backgroundSlideshowEnabled: checked
                        }))}
                      />
                    </div>
                    
                    {banner.backgroundSlideshowEnabled && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              Durée: {banner.backgroundSlideshowDuration / 1000}s
                            </Label>
                            <input
                              type="range"
                              min="2"
                              max="15"
                              value={banner.backgroundSlideshowDuration / 1000}
                              onChange={(e) => setBanner(prev => ({
                                ...prev,
                                backgroundSlideshowDuration: parseInt(e.target.value) * 1000
                              }))}
                              className="w-full mt-2"
                            />
                          </div>
                          <div>
                            <Label>Effet de Transition</Label>
                            <Select
                              value={banner.backgroundSlideshowTransition}
                              onValueChange={(value) => setBanner(prev => ({
                                ...prev,
                                backgroundSlideshowTransition: value
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fade">Fondu</SelectItem>
                                <SelectItem value="slide">Glissement</SelectItem>
                                <SelectItem value="zoom">Zoom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Images du Diaporama</CardTitle>
                      <CardDescription>
                        {banner.backgroundImages?.length || 0} image(s) configurée(s)
                      </CardDescription>
                    </div>
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
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {banner.backgroundImages && banner.backgroundImages.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {banner.backgroundImages.map((image, index) => (
                          <div 
                            key={image.id} 
                            className={`border rounded-lg p-3 space-y-2 transition-all ${
                              draggedItem === image.id ? 'bg-blue-50 border-blue-300 opacity-50' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, image.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, image.id)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                <Badge variant="secondary">#{index + 1}</Badge>
                                <span className="font-medium">{image.title || `Image ${index + 1}`}</span>
                              </div>
                              <Button
                                onClick={() => {
                                  setBanner(prev => ({
                                    ...prev,
                                    backgroundImages: prev.backgroundImages?.filter(img => img.id !== image.id) || []
                                  }));
                                }}
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <Input
                              value={image.title || ''}
                              onChange={(e) => {
                                const updatedImages = banner.backgroundImages?.map(img => 
                                  img.id === image.id ? { ...img, title: e.target.value } : img
                                ) || [];
                                setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                              }}
                              placeholder="Titre de l'image"
                              className="text-sm"
                            />
                            
                            <div className="flex gap-3">
                              <Input
                                value={image.imageUrl || ''}
                                onChange={(e) => {
                                  const updatedImages = banner.backgroundImages?.map(img => 
                                    img.id === image.id ? { ...img, imageUrl: e.target.value } : img
                                  ) || [];
                                  setBanner(prev => ({ ...prev, backgroundImages: updatedImages }));
                                }}
                                placeholder="URL de l'image ou utilisez le bouton upload"
                                className="text-sm"
                              />
                              <div className="relative">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={uploading === image.id}
                                  onClick={() => document.getElementById(`slideshow-upload-${image.id}`)?.click()}
                                >
                                  {uploading === image.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                                <input
                                  id={`slideshow-upload-${image.id}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSlideshowImageUpload(e, image.id)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                            
                            {image.imageUrl && (
                              <div className="relative h-20 rounded-lg overflow-hidden bg-gray-200">
                                <Image 
                                  src={image.imageUrl} 
                                  alt={image.title || `Image ${index + 1}`}
                                  fill
                                  className="object-cover"
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
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Image de Fond par Défaut</CardTitle>
                    <CardDescription>
                      Utilisée quand le diaporama est désactivé
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        value={banner.backgroundImage}
                        onChange={(e) => setBanner(prev => ({ ...prev, backgroundImage: e.target.value }))}
                        placeholder="URL de l'image de fond"
                      />
                      <div className="relative">
                        <Button
                          variant="outline"
                          disabled={uploading === 'background'}
                          onClick={() => document.getElementById('background-upload')?.click()}
                        >
                          {uploading === 'background' ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                        <input
                          id="background-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                    {banner.backgroundImage && (
                      <div className="relative h-32 rounded-lg overflow-hidden bg-gray-200">
                        <Image 
                          src={banner.backgroundImage} 
                          alt="Image de fond par défaut"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Couleurs */}
              <TabsContent value="colors" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Couleurs du Texte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Couleur du Titre</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.titleColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, titleColor: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.titleColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, titleColor: e.target.value }))}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Couleur du Sous-titre</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.subtitleColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, subtitleColor: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.subtitleColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, subtitleColor: e.target.value }))}
                          placeholder="#fde047"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Couleur de la Description</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.descriptionColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, descriptionColor: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.descriptionColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, descriptionColor: e.target.value }))}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Couleurs des Boutons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Bouton Principal - Arrière-plan</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.primaryButtonBg}
                          onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonBg: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.primaryButtonBg}
                          onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonBg: e.target.value }))}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Bouton Principal - Texte</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.primaryButtonColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonColor: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.primaryButtonColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, primaryButtonColor: e.target.value }))}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label>Bouton Secondaire - Arrière-plan</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.secondaryButtonBg === 'transparent' ? '#000000' : banner.secondaryButtonBg}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonBg: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.secondaryButtonBg}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonBg: e.target.value }))}
                          placeholder="transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Bouton Secondaire - Texte</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.secondaryButtonColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonColor: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.secondaryButtonColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonColor: e.target.value }))}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Bouton Secondaire - Bordure</Label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="color"
                          value={banner.secondaryButtonBorder}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonBorder: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.secondaryButtonBorder}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondaryButtonBorder: e.target.value }))}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>

              {/* Onglet Effets */}
              <TabsContent value="effects" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Effets sur l'Image</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Flou de l'Image: {banner.backgroundBlur}px</Label>
                      <p className="text-sm text-gray-500 mb-3">Applique un effet de flou à l'image de fond</p>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={banner.backgroundBlur}
                        onChange={(e) => setBanner(prev => ({ ...prev, backgroundBlur: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Net</span>
                        <span>Très flou</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-base font-medium">Opacité de l'Overlay: {banner.backgroundOpacity}%</Label>
                      <p className="text-sm text-gray-500 mb-3">Contrôle la transparence de la couche sombre</p>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={banner.backgroundOpacity}
                        onChange={(e) => setBanner(prev => ({ ...prev, backgroundOpacity: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Transparent</span>
                        <span>Opaque</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-base font-medium">Couleur de l'Overlay</Label>
                      <p className="text-sm text-gray-500 mb-3">Couleur de la couche superposée à l'image</p>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={banner.backgroundOverlayColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, backgroundOverlayColor: e.target.value }))}
                          className="w-16 h-10 rounded border"
                        />
                        <Input
                          value={banner.backgroundOverlayColor}
                          onChange={(e) => setBanner(prev => ({ ...prev, backgroundOverlayColor: e.target.value }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions Rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setBanner(prev => ({ 
                        ...prev, 
                        backgroundBlur: 0, 
                        backgroundOpacity: 0,
                        backgroundOverlayColor: '#000000'
                      }))}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Réinitialiser les Effets
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(banner, null, 2))
                        toast({ title: 'Configuration copiée', description: 'La configuration a été copiée dans le presse-papier' })
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copier la Configuration
                    </Button>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  )
}