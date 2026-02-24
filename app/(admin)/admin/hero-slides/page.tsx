'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { ImageUpload } from '@/components/image-upload'

interface HeroSlide {
  id: string
  title: string
  description: string | null
  image: string
  buttonText: string
  buttonLink: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    buttonText: 'Découvrir',
    buttonLink: '',
    isActive: true,
    order: 0
  })

  // Charger les slides
  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/admin/hero-slides')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setSlides(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les slides",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.image || !formData.buttonLink) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingSlide 
        ? `/api/admin/hero-slides/${editingSlide.id}`
        : '/api/admin/hero-slides'
      
      const response = await fetch(url, {
        method: editingSlide ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde')

      toast({
        title: "Succès",
        description: `Slide ${editingSlide ? 'modifié' : 'créé'} avec succès`,
      })

      setDialogOpen(false)
      resetForm()
      fetchSlides()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      })
    }
  }

  // Supprimer un slide
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce slide ?')) return

    try {
      const response = await fetch(`/api/admin/hero-slides/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      toast({
        title: "Succès",
        description: "Slide supprimé avec succès",
      })

      fetchSlides()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      })
    }
  }

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      buttonText: 'Découvrir',
      buttonLink: '',
      isActive: true,
      order: 0
    })
    setEditingSlide(null)
  }

  // Ouvrir le dialogue d'édition
  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      description: slide.description || '',
      image: slide.image,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      isActive: slide.isActive,
      order: slide.order
    })
    setDialogOpen(true)
  }

  // Déplacer un slide
  const moveSlide = async (id: string, direction: 'up' | 'down') => {
    const slideIndex = slides.findIndex(s => s.id === id)
    if (slideIndex === -1) return

    const newOrder = direction === 'up' ? slides[slideIndex].order - 1 : slides[slideIndex].order + 1
    
    try {
      const response = await fetch(`/api/admin/hero-slides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...slides[slideIndex], order: newOrder })
      })

      if (!response.ok) throw new Error('Erreur lors du déplacement')
      fetchSlides()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du déplacement",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Slides</h1>
          <p className="text-gray-600">Gérez les slides du carrousel de la page d'accueil</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Modifier le Slide' : 'Nouveau Slide'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Titre du slide"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Texte du bouton</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                    placeholder="Découvrir"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description du slide"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buttonLink">Lien du bouton *</Label>
                <Input
                  id="buttonLink"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                  placeholder="/services, /products, https://..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Image du slide *</Label>
                <ImageUpload
                  value={formData.image ? [formData.image] : []}
                  onChange={(urls) => setFormData({...formData, image: urls[0] || ''})}
                  onRemove={() => setFormData({...formData, image: ''})}
                  imageType="general"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Slide actif</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="order">Ordre d'affichage</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingSlide ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {slides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun slide</h3>
            <p className="text-gray-600 mb-4">Créez votre premier slide pour le carrousel</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {slides.map((slide, index) => (
            <Card key={slide.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {slide.title}
                    <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                      {slide.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSlide(slide.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSlide(slide.id, 'down')}
                      disabled={index === slides.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(slide)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slide.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative h-32">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-gray-600">{slide.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Bouton: "{slide.buttonText}"</span>
                      <span>Lien: {slide.buttonLink}</span>
                      <span>Ordre: {slide.order}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
