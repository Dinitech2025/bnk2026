'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { VariationsForm } from './variations-form'
import { toast } from 'sonner'

interface ProductAttribute {
  id: string
  name: string
  value: string
}

interface ProductImage {
  id: string
  path: string
  alt?: string
}

interface ProductVariation {
  id?: string
  sku?: string
  price: number
  inventory: number
  attributes: ProductAttribute[]
  images: ProductImage[]
}

interface ProductVariationsManagerProps {
  productId: string
  initialVariations: any[] // Utiliser any pour éviter les problèmes de types
  productAttributes: any[] // Utiliser any pour éviter les problèmes de types
}

export default function ProductVariationsManager({ 
  productId, 
  initialVariations, 
  productAttributes 
}: ProductVariationsManagerProps) {
  const [variations, setVariations] = useState<ProductVariation[]>(initialVariations || [])
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/variations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variations }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des variations')
      }

      toast.success('Variations sauvegardées avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde des variations')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Gestion des variations</h2>
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
        >
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder les variations'}
        </Button>
      </div>

      <VariationsForm
        variations={variations}
        attributes={productAttributes}
        onChange={(newVariations) => {
          setVariations(newVariations as any);
        }}
      />
    </div>
  )
} 
 
 
 
 
 
 