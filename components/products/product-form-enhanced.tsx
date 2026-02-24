'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X, Image as ImageIcon, DollarSign, Package, Settings, Eye, Plus, GripVertical, Tag, BarChart3, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Image from 'next/image'
import { VariationsFormEnhanced } from './variations-form-enhanced'

interface Category {
  id: string
  name: string
}

interface ProductImage {
  id: string
  path: string
  alt?: string
  order?: number
}

interface ProductAttribute {
  id: string
  name: string
  value: string
}

interface ProductVariation {
  id?: string
  sku?: string
  price: number
  inventory: number
  attributes: ProductAttribute[]
  images: ProductImage[]
}

type PricingType = 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED' | 'AUCTION'

interface ProductFormData {
  name: string
  slug: string
  description: string
  sku: string
  price: number
  compareAtPrice?: number
  inventory: number
  categoryId: string
  published: boolean
  featured: boolean
  barcode?: string
  weight?: number
  dimensions?: string
  images: File[]
  existingImages: ProductImage[]
  variations: ProductVariation[]
  attributes: ProductAttribute[]
  tags: string[]
  lowStockThreshold?: number
  metaTitle?: string
  metaDescription?: string
  pricingType: PricingType
  minPrice?: number
  maxPrice?: number
  requiresQuote: boolean
  autoAcceptNegotiation: boolean
  // Champs pour les enchères
  auctionEndDate?: Date
  minimumBid?: number
}

interface ProductFormEnhancedProps {
  categories: Category[]
  initialData?: {
    id: string
    name: string
    slug?: string
    description: string | null
    sku: string | null
    price: number
    compareAtPrice: number | null
    inventory: number
    categoryId: string | null
    published: boolean
    featured: boolean
    barcode: string | null
    weight: number | null
    dimensions: string | null
    images: ProductImage[]
    variations: ProductVariation[]
    attributes: ProductAttribute[]
    pricingType?: PricingType
    minPrice?: number | null
    maxPrice?: number | null
    requiresQuote?: boolean
    autoAcceptNegotiation?: boolean
  }
}

// Fonction pour générer un slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Fonction pour générer un SKU
function generateSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PRD-${timestamp}-${random}`
}

export function ProductFormEnhanced({ categories, initialData }: ProductFormEnhancedProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [newTag, setNewTag] = useState('')
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    sku: initialData?.sku || '',
    price: initialData?.price || 0,
    compareAtPrice: initialData?.compareAtPrice ?? undefined,
    inventory: initialData?.inventory || 0,
    categoryId: initialData?.categoryId || '',
    published: initialData?.published ?? true,
    featured: initialData?.featured ?? false,
    barcode: initialData?.barcode ?? undefined,
    weight: initialData?.weight ?? undefined,
    dimensions: initialData?.dimensions ?? undefined,
    images: [],
    existingImages: initialData?.images || [],
    variations: initialData?.variations || [],
    attributes: initialData?.attributes || [],
    tags: [],
    lowStockThreshold: 10,
    metaTitle: '',
    metaDescription: '',
    pricingType: (initialData?.pricingType || 'FIXED') as PricingType,
    minPrice: initialData?.minPrice ?? undefined,
    maxPrice: initialData?.maxPrice ?? undefined,
    requiresQuote: initialData?.requiresQuote ?? false,
    autoAcceptNegotiation: initialData?.autoAcceptNegotiation ?? false,
    auctionEndDate: initialData?.auctionEndDate ? new Date(initialData.auctionEndDate) : undefined,
    minimumBid: initialData?.minimumBid ?? undefined
  })

  // Auto-générer le slug quand le nom change
  useEffect(() => {
    if (formData.name && !initialData) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.name)
      }))
    }
  }, [formData.name, initialData])

  // Calculer automatiquement le stock à partir des variations
  const totalVariationStock = useMemo(() => {
    return formData.variations.reduce((sum, variation) => sum + (variation.inventory || 0), 0)
  }, [formData.variations])

  // Mettre à jour le stock principal quand les variations changent
  useEffect(() => {
    if (formData.variations.length > 0) {
      setFormData(prev => ({
        ...prev,
        inventory: totalVariationStock
      }))
    }
  }, [totalVariationStock, formData.variations.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numberValue = value === '' ? 0 : parseFloat(value)
    if (!isNaN(numberValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: numberValue
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      const totalImages = formData.images.length + formData.existingImages.length + newImages.length
      
      if (totalImages > 5) {
        toast({
          title: "Limite d'images dépassée",
          description: "Vous ne pouvez ajouter que 5 images maximum par produit",
          variant: "destructive"
        })
        return
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }))
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const removeExistingImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter(img => img.id !== imageId)
    }))
  }

  // Drag and drop pour réorganiser les images
  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedImageIndex === null) return

    const newImages = [...formData.images]
    const [draggedImage] = newImages.splice(draggedImageIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)

    setFormData(prev => ({
      ...prev,
      images: newImages
    }))
    setDraggedImageIndex(null)
  }

  // Gestion des tags
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Calcul de la marge
  const calculateMargin = () => {
    if (formData.price && formData.compareAtPrice) {
      const margin = ((formData.compareAtPrice - formData.price) / formData.compareAtPrice) * 100
      return margin.toFixed(2)
    }
    return '0.00'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Ajouter toutes les données du produit
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach((image: File) => {
            formDataToSend.append('images', image)
          })
        } else if (key === 'existingImages') {
          formDataToSend.append('existingImages', JSON.stringify((value as ProductImage[]).map(img => img.id)))
        } else if (key === 'variations' || key === 'tags') {
          formDataToSend.append(key, JSON.stringify(value))
        } else if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString())
        }
      })

      const url = initialData 
        ? `/api/admin/products/${initialData.id}`
        : '/api/admin/products'

      const res = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        body: formDataToSend
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Une erreur est survenue')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement du produit')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Prix</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Images</span>
          </TabsTrigger>
          <TabsTrigger value="variations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Variations</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Les informations de base de votre produit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: T-shirt Premium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="t-shirt-premium"
                  />
                  <p className="text-xs text-muted-foreground">
                    Généré automatiquement si vide
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Décrivez votre produit en détail..."
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sku">Référence (SKU)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="PRD-XXX"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, sku: generateSKU() }))}
                      title="Générer un SKU"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Code-barres</Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Catégorie</Label>
                  <Select 
                    value={formData.categoryId || "uncategorized"}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        categoryId: value === "uncategorized" ? "" : value
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">Sans catégorie</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={handleNumberInput}
                    placeholder="0.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions (L x l x H cm)</Label>
                  <Input
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    placeholder="30 x 20 x 10"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Ajouter un tag"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres de publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="published">Produit publié</Label>
                  <p className="text-sm text-muted-foreground">
                    Le produit sera visible sur le site
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Produit mis en avant</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher dans la section vedette
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Prix */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
              <CardDescription>Définissez les prix et le stock</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix d'achat / Coût *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Ar
                    </span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleNumberInput}
                      className="pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Prix de vente</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Ar
                    </span>
                    <Input
                      id="compareAtPrice"
                      name="compareAtPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={handleNumberInput}
                      className="pl-12"
                    />
                  </div>
                </div>
              </div>

              {formData.price > 0 && formData.compareAtPrice && formData.compareAtPrice > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Marge bénéficiaire</p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.compareAtPrice - formData.price).toFixed(2)} Ar de bénéfice
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{calculateMargin()}%</p>
                        <p className="text-xs text-muted-foreground">de marge</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Configuration du type de tarification */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Type de tarification</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez comment le prix de ce produit sera défini
                  </p>
                </div>

                <RadioGroup
                  value={formData.pricingType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pricingType: value as PricingType }))}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value="FIXED" id="pricing-fixed" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="pricing-fixed" className="font-medium cursor-pointer">
                        Prix fixe
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le prix est fixe et ne peut pas être négocié
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value="RANGE" id="pricing-range" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="pricing-range" className="font-medium cursor-pointer">
                        Plage de prix
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le client peut proposer un prix dans une plage définie
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value="NEGOTIABLE" id="pricing-negotiable" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="pricing-negotiable" className="font-medium cursor-pointer">
                        Prix négociable
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le client peut proposer n'importe quel prix (nécessite validation)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                    <RadioGroupItem value="QUOTE_REQUIRED" id="pricing-quote" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="pricing-quote" className="font-medium cursor-pointer">
                        Sur devis uniquement
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le client doit demander un devis personnalisé (pas de prix affiché)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 border-orange-200 bg-orange-50">
                    <RadioGroupItem value="AUCTION" id="pricing-auction" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="pricing-auction" className="font-medium cursor-pointer text-orange-700">
                        Enchère
                      </Label>
                      <p className="text-sm text-orange-600">
                        Le produit sera vendu au plus offrant dans un délai défini
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                {/* Options supplémentaires pour RANGE */}
                {formData.pricingType === 'RANGE' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minPrice">Prix minimum *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              Ar
                            </span>
                            <Input
                              id="minPrice"
                              name="minPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.minPrice}
                              onChange={handleNumberInput}
                              className="pl-12"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxPrice">Prix maximum *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              Ar
                            </span>
                            <Input
                              id="maxPrice"
                              name="maxPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.maxPrice}
                              onChange={handleNumberInput}
                              className="pl-12"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoAcceptNegotiation">Auto-acceptation</Label>
                          <p className="text-xs text-muted-foreground">
                            Accepter automatiquement les prix dans la plage
                          </p>
                        </div>
                        <Switch
                          id="autoAcceptNegotiation"
                          checked={formData.autoAcceptNegotiation}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAcceptNegotiation: checked }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Options pour NEGOTIABLE et QUOTE_REQUIRED */}
                {(formData.pricingType === 'NEGOTIABLE' || formData.pricingType === 'QUOTE_REQUIRED') && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="requiresQuote">Devis requis</Label>
                          <p className="text-xs text-muted-foreground">
                            Le client doit obligatoirement demander un devis
                          </p>
                        </div>
                        <Switch
                          id="requiresQuote"
                          checked={formData.requiresQuote || formData.pricingType === 'QUOTE_REQUIRED'}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresQuote: checked }))}
                          disabled={formData.pricingType === 'QUOTE_REQUIRED'}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Options pour AUCTION */}
                {formData.pricingType === 'AUCTION' && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minimumBid">Mise minimum (Ar)</Label>
                          <Input
                            id="minimumBid"
                            type="number"
                            value={formData.minimumBid || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, minimumBid: Number(e.target.value) || undefined }))}
                            placeholder="Ex: 10000"
                            min="0"
                            step="1000"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Montant minimum pour démarrer l'enchère
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="auctionEndDate">Date de fin d'enchère</Label>
                          <Input
                            id="auctionEndDate"
                            type="datetime-local"
                            value={formData.auctionEndDate ? formData.auctionEndDate.toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, auctionEndDate: e.target.value ? new Date(e.target.value) : undefined }))}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Date et heure de fin de l'enchère
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {formData.pricingType !== 'FIXED' && formData.pricingType !== 'AUCTION' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {formData.pricingType === 'QUOTE_REQUIRED' 
                        ? "Le prix ne sera pas affiché. Les clients devront demander un devis personnalisé."
                        : formData.pricingType === 'NEGOTIABLE'
                        ? "Les clients pourront proposer leur propre prix qui nécessitera votre validation."
                        : "Les clients pourront proposer un prix entre le minimum et le maximum définis."}
                    </AlertDescription>
                  </Alert>
                )}

                {formData.pricingType === 'AUCTION' && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      <strong>Mode Enchère :</strong> Le produit sera vendu au plus offrant. 
                      Définissez une mise minimum et une date de fin pour l'enchère.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inventory">Quantité en stock *</Label>
                  {formData.variations.length > 0 ? (
                    <>
                      <div className="relative">
                        <Input
                          id="inventory"
                          name="inventory"
                          type="number"
                          value={formData.inventory}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                        <Badge 
                          variant="secondary" 
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          Auto
                        </Badge>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Stock calculé automatiquement: {totalVariationStock} unités ({formData.variations.length} variations)
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <>
                      <Input
                        id="inventory"
                        name="inventory"
                        type="number"
                        min="0"
                        value={formData.inventory}
                        onChange={handleNumberInput}
                        required
                      />
                      {formData.inventory <= (formData.lowStockThreshold || 10) && (
                        <p className="text-sm text-orange-600 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-orange-600"></span>
                          Stock faible
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Seuil de stock faible</Label>
                  <Input
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={handleNumberInput}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerte quand le stock descend sous ce seuil
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Images */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Galerie d'images</CardTitle>
              <CardDescription>
                Glissez-déposez pour réorganiser. La première image sera l'image principale. 
                <span className="font-medium text-orange-600">Maximum 5 images par produit.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Images existantes et nouvelles */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.existingImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={image.path}
                        alt={image.alt || `Image ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <Badge className="absolute bottom-2 left-2" variant="secondary">
                        Principale
                      </Badge>
                    )}
                  </div>
                ))}

                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className="relative group cursor-move"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Nouvelle image ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {formData.existingImages.length === 0 && index === 0 && (
                      <Badge className="absolute bottom-2 left-2" variant="secondary">
                        Principale
                      </Badge>
                    )}
                  </div>
                ))}

                {/* Zone d'upload */}
                <Label
                  htmlFor="images"
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center px-2">
                    Ajouter des images
                    <br />
                    <span className="text-xs">
                      ({formData.images.length + formData.existingImages.length}/5)
                    </span>
                  </span>
                  <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={formData.images.length + formData.existingImages.length >= 5}
                  />
                </Label>
              </div>

              {(formData.images.length > 0 || formData.existingImages.length > 0) && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {formData.images.length + formData.existingImages.length} image(s) au total
                  </p>
                  {formData.images.length + formData.existingImages.length >= 5 && (
                    <Badge variant="secondary" className="text-xs">
                      Limite atteinte (5/5)
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Variations */}
        <TabsContent value="variations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variations de produit</CardTitle>
              <CardDescription>
                Créez des variantes (tailles, couleurs, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariationsFormEnhanced 
                variations={formData.variations} 
                attributes={formData.attributes}
                mainProductStock={formData.inventory}
                onChange={(newVariations) => {
                  setFormData(prev => ({
                    ...prev,
                    variations: newVariations as any
                  }))
                }}
                onStockAlert={(totalVariationStock) => {
                  console.warn(`Alerte stock: Les variations (${totalVariationStock}) dépassent le stock principal (${formData.inventory})`)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet SEO */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimisation SEO</CardTitle>
              <CardDescription>
                Améliorez le référencement de votre produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Titre SEO</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder={formData.name || "Titre pour les moteurs de recherche"}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.metaTitle?.length || 0}/60 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Description SEO</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  placeholder="Description pour les moteurs de recherche"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.metaDescription?.length || 0}/160 caractères
                </p>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Aperçu dans les résultats Google</p>
                <div className="space-y-1">
                  <p className="text-blue-600 text-lg">
                    {formData.metaTitle || formData.name || 'Titre du produit'}
                  </p>
                  <p className="text-green-700 text-sm">
                    https://boutiknaka.com/products/{formData.slug || 'produit'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.metaDescription || formData.description?.substring(0, 160) || 'Description du produit...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Boutons d'action fixes en bas */}
      <div className="sticky bottom-0 bg-background border-t p-4 flex justify-between items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab('general')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                {initialData ? 'Mettre à jour' : 'Créer le produit'}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

