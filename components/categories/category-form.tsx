'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

interface CategoryFormData {
  name: string
  description: string
  parentId: string
  image: File | null
  existingImage: string | null
}

interface CategoryFormProps {
  categories: Category[]
  initialData?: {
    id: string
    name: string
    description: string | null
    parentId: string | null
    image: string | null
  }
}

export function CategoryForm({ categories, initialData }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    parentId: initialData?.parentId || '',
    image: null,
    existingImage: initialData?.image || null
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0],
        existingImage: null
      }))
    }
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      existingImage: null
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('parentId', formData.parentId)
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }
      
      if (formData.existingImage === null) {
        formDataToSend.append('removeImage', 'true')
      }

      const url = initialData 
        ? `/api/admin/products/categories/${initialData.id}`
        : '/api/admin/products/categories'

      const res = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        body: formDataToSend
      })

      if (!res.ok) {
        throw new Error('Une erreur est survenue')
      }

      router.push('/admin/products/categories')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue lors de l\'enregistrement de la catégorie')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer les catégories pour éviter la sélection de la catégorie courante comme parent
  const availableParentCategories = categories.filter(
    category => category.id !== initialData?.id
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        <div>
          <Label htmlFor="name">Nom de la catégorie</Label>
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
          <Label htmlFor="parentId">Catégorie parente</Label>
          <Select 
            value={formData.parentId || "none"}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              parentId: value === "none" ? "" : value 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie parente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune catégorie parente</SelectItem>
              {availableParentCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Image</Label>
          <div className="mt-2 space-y-4">
            {/* Image existante ou prévisualisation */}
            {(formData.existingImage || formData.image) && (
              <div className="relative w-40 h-40">
                <Image
                  src={formData.image ? URL.createObjectURL(formData.image) : formData.existingImage!}
                  alt="Category preview"
                  fill
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input pour upload */}
            {!formData.image && !formData.existingImage && (
              <div>
                <Label htmlFor="image" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Cliquez pour ajouter une image</span>
                  </div>
                </Label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>
        </div>
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