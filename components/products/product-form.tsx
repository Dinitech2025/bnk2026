'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { VariationsForm } from './variations-form'

interface Category {
  id: string
  name: string
}

interface ProductImage {
  id: string
  path: string
  alt?: string
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

interface ProductFormData {
  name: string
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
}

interface ProductFormProps {
  categories: Category[]
  initialData?: {
    id: string
    name: string
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
  }
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
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
    attributes: initialData?.attributes || []
  })

  useEffect(() => {
    console.log('Categories:', categories)
    console.log('Initial categoryId:', initialData?.categoryId)
    console.log('Current categoryId:', formData.categoryId)
  }, [categories, initialData, formData.categoryId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Ajouter les données du produit
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('sku', formData.sku)
      formDataToSend.append('price', formData.price.toString())
      formDataToSend.append('compareAtPrice', formData.compareAtPrice?.toString() || '')
      formDataToSend.append('inventory', formData.inventory.toString())
      formDataToSend.append('categoryId', formData.categoryId)
      formDataToSend.append('published', formData.published.toString())
      formDataToSend.append('featured', formData.featured.toString())
      formDataToSend.append('barcode', formData.barcode || '')
      formDataToSend.append('weight', formData.weight?.toString() || '')
      formDataToSend.append('dimensions', formData.dimensions || '')
      
      // Ajouter les nouvelles images
      formData.images.forEach(image => {
        formDataToSend.append('images', image)
      })
      
      // Ajouter les IDs des images existantes à conserver
      formDataToSend.append('existingImages', JSON.stringify(formData.existingImages.map(img => img.id)))
      
      // Ajouter les variations
      formDataToSend.append('variations', JSON.stringify(formData.variations))

      const url = initialData 
        ? `/api/admin/products/${initialData.id}`
        : '/api/admin/products'

      const res = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        body: formDataToSend
      })

      if (!res.ok) {
        throw new Error('Une erreur est survenue')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue lors de l\'enregistrement du produit')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Nom du produit</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="sku">Référence</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select 
              defaultValue={formData.categoryId || "uncategorized"}
              onValueChange={(value) => {
                console.log('Selected value:', value)
                setFormData(prev => ({
                  ...prev,
                  categoryId: value === "uncategorized" ? "" : value
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Sans catégorie</SelectItem>
                {categories.filter(category => category.id).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Prix</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleNumberInput}
              required
            />
          </div>

          <div>
            <Label htmlFor="compareAtPrice">Prix de vente</Label>
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.compareAtPrice}
              onChange={handleNumberInput}
            />
          </div>

          <div>
            <Label htmlFor="inventory">Quantité en stock</Label>
            <Input
              id="inventory"
              name="inventory"
              type="number"
              min="0"
              value={formData.inventory}
              onChange={handleNumberInput}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="published">Produit publié</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
            />
            <Label htmlFor="featured">Produit mis en avant</Label>
          </div>
        </div>

        <div>
          <Label>Images du produit</Label>
          <div className="mt-2 space-y-4">
            {/* Images existantes */}
            {formData.existingImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {formData.existingImages.map((image) => (
                  <div key={image.id} className="relative">
                    <Image
                      src={image.path}
                      alt="Product preview"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Nouvelles images */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt="Product preview"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input pour upload */}
            <div>
              <Label htmlFor="images" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Cliquez pour ajouter des images</span>
                </div>
              </Label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <VariationsForm 
          variations={formData.variations} 
          attributes={formData.attributes}
          onChange={(newVariations) => {
            setFormData({
              ...formData,
              variations: newVariations as any
            });
          }}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
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
            'Enregistrer'
          )}
        </Button>
      </div>
    </form>
  )
} 