'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

interface InventoryFormData {
  type: 'add' | 'remove' | 'set'
  quantity: number
  reason: string
}

interface ProductVariation {
  id: string;
  sku: string | null;
  inventory: number;
  attributes: any[];
}

interface InventoryFormProps {
  productId: string;
  currentStock: number;
  productName: string;
  variations?: ProductVariation[];
  totalStock?: number;
}

export function InventoryForm({ 
  productId, 
  currentStock, 
  productName, 
  variations = [],
  totalStock
}: InventoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<InventoryFormData>({
    type: 'add',
    quantity: 0,
    reason: ''
  })
  const [activeTab, setActiveTab] = useState<'product' | 'variations'>('product')
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Si une variation est sélectionnée, ajuster le stock de cette variation
      const endpoint = selectedVariation 
        ? `/api/admin/products/${productId}/variations/${selectedVariation}/inventory` 
        : `/api/admin/products/${productId}/inventory`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Une erreur est survenue')
      }

      router.push('/admin/products/inventory')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue lors de l\'ajustement du stock')
    } finally {
      setIsLoading(false)
    }
  }

  // Déterminer le stock à ajuster en fonction de l'onglet actif et de la variation sélectionnée
  const stockToAdjust = activeTab === 'product' 
    ? currentStock 
    : selectedVariation 
      ? variations.find(v => v.id === selectedVariation)?.inventory || 0
      : 0

  // Calculer le nouveau stock après ajustement
  const newStock = formData.type === 'add' 
    ? stockToAdjust + formData.quantity
    : formData.type === 'remove'
    ? Math.max(0, stockToAdjust - formData.quantity)
    : formData.quantity

  // Formater le nom d'attribut et sa valeur pour l'affichage
  const formatAttributeName = (attr: any) => {
    return `${attr.name}: ${attr.value}`
  }

  // Générer une description lisible des attributs d'une variation
  const getVariationDescription = (variation: ProductVariation) => {
    if (!variation.attributes || variation.attributes.length === 0) {
      return variation.sku || `Variation #${variation.id.substring(0, 8)}`
    }
    
    return variation.attributes
      .map(attr => formatAttributeName(attr))
      .join(', ')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-medium">Ajuster le stock de {productName}</h2>
        {totalStock !== undefined && (
          <p className="text-sm text-gray-500">
            Stock total : {totalStock} unités (Produit: {currentStock}, Variations: {totalStock - currentStock})
          </p>
        )}
      </div>

      {variations.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              type="button"
              className={`mr-4 py-2 px-1 border-b-2 ${
                activeTab === 'product' 
                  ? 'border-primary text-primary font-medium' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => {
                setActiveTab('product')
                setSelectedVariation(null)
              }}
            >
              Produit principal
            </button>
            <button
              type="button"
              className={`py-2 px-1 border-b-2 ${
                activeTab === 'variations' 
                  ? 'border-primary text-primary font-medium' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('variations')}
            >
              Variations
            </button>
          </div>
        </div>
      )}

      {activeTab === 'variations' && variations.length > 0 && (
        <div className="space-y-4">
          <Label>Sélectionner une variation</Label>
          <div className="grid gap-4">
            {variations.map((variation) => (
              <div 
                key={variation.id}
                className={`border rounded-md p-4 cursor-pointer ${
                  selectedVariation === variation.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedVariation(variation.id)}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-sm">{getVariationDescription(variation)}</p>
                    <p className="text-xs text-gray-500">{variation.sku || 'Sans référence'}</p>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    variation.inventory > 10 
                      ? 'bg-green-100 text-green-800'
                      : variation.inventory > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {variation.inventory} en stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* N'afficher les contrôles d'ajustement que si on est sur l'onglet produit ou si une variation est sélectionnée */}
      {(activeTab === 'product' || selectedVariation) && (
        <div className="space-y-4">
          <div>
            <Label>Type d'ajustement</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: 'add' | 'remove' | 'set') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
              className="grid grid-cols-3 gap-4 mt-2"
            >
              <div>
                <RadioGroupItem value="add" id="add" className="peer sr-only" />
                <Label
                  htmlFor="add"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Plus className="mb-2 h-6 w-6" />
                  Ajouter
                </Label>
              </div>
              <div>
                <RadioGroupItem value="remove" id="remove" className="peer sr-only" />
                <Label
                  htmlFor="remove"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Minus className="mb-2 h-6 w-6" />
                  Retirer
                </Label>
              </div>
              <div>
                <RadioGroupItem value="set" id="set" className="peer sr-only" />
                <Label
                  htmlFor="set"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="mb-2 h-6 w-6 flex items-center justify-center">=</span>
                  Définir
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="quantity">Quantité</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                quantity: parseInt(e.target.value) || 0 
              }))}
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Nouveau stock après ajustement : {newStock} unités
              {activeTab === 'variations' && selectedVariation && (
                <span> (variation)</span>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Raison de l'ajustement</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                reason: e.target.value 
              }))}
              rows={4}
              placeholder="Expliquez la raison de cet ajustement de stock..."
              required
            />
          </div>
        </div>
      )}

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
          disabled={isLoading || (activeTab === 'variations' && !selectedVariation)}
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