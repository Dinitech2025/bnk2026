'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Upload, X } from "lucide-react"
import Image from "next/image"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Combobox, ComboboxOption } from "@/components/ui/combobox"

// Types pour les variations de produits
interface ProductAttribute {
  name: string
  value: string
}

interface ProductVariation {
  sku?: string
  price: number
  inventory: number
  attributes: ProductAttribute[]
  images: { path: string }[]
}

interface VariationsFormProps {
  variations: ProductVariation[]
  attributes: ProductAttribute[]
  onChange: (variations: ProductVariation[]) => void
}

export function VariationsForm({ variations, attributes, onChange }: VariationsFormProps) {
  // Helper pour normaliser les attributs
  const normalizeAttributes = (attrs: ProductAttribute[]) => {
    return attrs.map(attr => ({
      ...attr,
      name: attr.name.trim().toLowerCase(),
      value: attr.value.trim()
    }));
  };

  // Helper pour vérifier si deux ensembles d'attributs sont équivalents
  const areAttributesEquivalent = (attrs1: ProductAttribute[], attrs2: ProductAttribute[]) => {
    if (attrs1.length !== attrs2.length) return false;
    
    const normalized1 = normalizeAttributes(attrs1);
    const normalized2 = normalizeAttributes(attrs2);
    
    // Trier les attributs par nom pour comparaison
    const sorted1 = [...normalized1].sort((a, b) => a.name.localeCompare(b.name));
    const sorted2 = [...normalized2].sort((a, b) => a.name.localeCompare(b.name));
    
    // Comparer chaque attribut normalisé
    return sorted1.every((attr, idx) => 
      attr.name === sorted2[idx].name && 
      attr.value === sorted2[idx].value
    );
  };

  // S'assurer que toutes les variations ont un tableau images initialisé
  const normalizedVariations = variations.map(variation => ({
    ...variation,
    attributes: variation.attributes || [],
    images: variation.images || []
  }))

  // État pour le dialogue d'ajout uniquement
  const [showDialog, setShowDialog] = useState(false)
  const [newVariation, setNewVariation] = useState<ProductVariation>({
    sku: '',
    price: 0,
    inventory: 0,
    attributes: [],
    images: []
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  // État pour stocker les options de ComboBox pour les attributs
  const [attributeOptions, setAttributeOptions] = useState<ComboboxOption[]>([])
  const [attributeValueOptions, setAttributeValueOptions] = useState<{ [key: string]: ComboboxOption[] }>({})
  
  // Charger les attributs existants au chargement du composant
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await fetch('/api/admin/products/attributes')
        if (response.ok) {
          const data = await response.json()
          // Transformer les données pour le format ComboboxOption
          const options = data.map((attr: { name: string, values: string[] }) => ({
            value: attr.name,
            label: attr.name.charAt(0).toUpperCase() + attr.name.slice(1) // Capitalize
          }))
          setAttributeOptions(options)
          
          // Préparer les options de valeurs pour chaque attribut
          const valueOptions: { [key: string]: ComboboxOption[] } = {}
          data.forEach((attr: { name: string, values: string[] }) => {
            valueOptions[attr.name] = attr.values.map(value => ({
              value,
              label: value
            }))
          })
          setAttributeValueOptions(valueOptions)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des attributs:", error)
      }
    }
    
    fetchAttributes()
  }, [])

  // Handlers pour les variations existantes (transmettent directement les changements au parent)
  const handleVariationChange = (index: number, field: string, value: any) => {
    const updatedVariations = [...normalizedVariations]
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value
    }
    onChange(updatedVariations)
  }

  // Handlers pour gérer l'ajout et la suppression d'attributs aux variations existantes
  const addAttributeToVariation = (index: number) => {
    const updatedVariations = [...normalizedVariations]
    updatedVariations[index] = {
      ...updatedVariations[index],
      attributes: [...updatedVariations[index].attributes, { name: '', value: '' }]
    }
    onChange(updatedVariations)
  }

  const removeAttributeFromVariation = (variationIndex: number, attributeIndex: number) => {
    const updatedVariations = [...normalizedVariations]
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      attributes: updatedVariations[variationIndex].attributes.filter((_: ProductAttribute, i: number) => i !== attributeIndex)
    }
    onChange(updatedVariations)
  }

  const handleAttributeChange = (
    variationIndex: number, 
    attributeIndex: number, 
    field: string, 
    value: string
  ) => {
    const updatedVariations = [...normalizedVariations]
    const attributes = [...updatedVariations[variationIndex].attributes]
    
    // Formater correctement la valeur selon le champ
    const formattedValue = field === 'name' && value 
      ? value.trim().toLowerCase() 
      : value.trim()
    
    attributes[attributeIndex] = {
      ...attributes[attributeIndex],
      [field]: formattedValue
    }
    
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      attributes
    }
    onChange(updatedVariations)
    
    // Si c'est un nouvel attribut ou une nouvelle valeur, l'ajouter aux options
    if (field === 'name' && formattedValue) {
      const existingOption = attributeOptions.find(
        opt => opt.value.toLowerCase() === formattedValue.toLowerCase()
      )
      
      if (!existingOption) {
        const newOption = { 
          value: formattedValue,
          label: formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1)
        }
        setAttributeOptions(prev => [...prev, newOption])
        
        // Initialiser un tableau vide pour les valeurs de ce nouvel attribut
        setAttributeValueOptions(prev => ({
          ...prev,
          [formattedValue]: []
        }))
      }
    } 
    else if (field === 'value' && formattedValue) {
      const attrName = attributes[attributeIndex].name.toLowerCase()
      if (!attrName) return
      
      // S'assurer que l'attribut existe dans notre map de valeurs
      if (!attributeValueOptions[attrName]) {
        setAttributeValueOptions(prev => ({
          ...prev,
          [attrName]: []
        }))
      }
      
      const existingValue = attributeValueOptions[attrName]?.find(
        opt => opt.value.toLowerCase() === formattedValue.toLowerCase()
      )
      
      if (!existingValue) {
        setAttributeValueOptions(prev => ({
          ...prev,
          [attrName]: [
            ...(prev[attrName] || []),
            { value: formattedValue, label: formattedValue }
          ]
        }))
      }
    }
  }

  const removeVariation = (index: number) => {
    onChange(normalizedVariations.filter((_, i) => i !== index))
  }

  // Handlers pour le dialogue d'ajout d'une nouvelle variation
  const handleNewVariationChange = (field: string, value: any) => {
    setNewVariation({
      ...newVariation,
      [field]: value
    })
  }

  const handleNewAttributeChange = (index: number, field: string, value: string) => {
    const attributes = [...newVariation.attributes]
    
    // Formater correctement la valeur selon le champ
    const formattedValue = field === 'name' && value 
      ? value.trim().toLowerCase() 
      : value.trim()
    
    attributes[index] = {
      ...attributes[index],
      [field]: formattedValue
    }
    
    setNewVariation({
      ...newVariation,
      attributes
    })
    
    // Si c'est un nouvel attribut ou une nouvelle valeur, l'ajouter aux options
    if (field === 'name' && formattedValue) {
      const existingOption = attributeOptions.find(
        opt => opt.value.toLowerCase() === formattedValue.toLowerCase()
      )
      
      if (!existingOption) {
        const newOption = { 
          value: formattedValue,
          label: formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1)
        }
        setAttributeOptions(prev => [...prev, newOption])
        
        // Initialiser un tableau vide pour les valeurs de ce nouvel attribut
        setAttributeValueOptions(prev => ({
          ...prev,
          [formattedValue]: []
        }))
      }
    } 
    else if (field === 'value' && formattedValue) {
      const attrName = attributes[index].name.toLowerCase()
      if (!attrName) return
      
      // S'assurer que l'attribut existe dans notre map de valeurs
      if (!attributeValueOptions[attrName]) {
        setAttributeValueOptions(prev => ({
          ...prev,
          [attrName]: []
        }))
      }
      
      const existingValue = attributeValueOptions[attrName]?.find(
        opt => opt.value.toLowerCase() === formattedValue.toLowerCase()
      )
      
      if (!existingValue) {
        setAttributeValueOptions(prev => ({
          ...prev,
          [attrName]: [
            ...(prev[attrName] || []),
            { value: formattedValue, label: formattedValue }
          ]
        }))
      }
    }
  }

  const addAttributeToNewVariation = () => {
    setNewVariation({
      ...newVariation,
      attributes: [...newVariation.attributes, { name: '', value: '' }]
    })
  }

  const removeAttributeFromNewVariation = (index: number) => {
    setNewVariation({
      ...newVariation,
      attributes: newVariation.attributes.filter((_: ProductAttribute, i: number) => i !== index)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
      
      // Créer des URL pour prévisualiser les images
      const imageUrls = files.map(file => ({
        path: URL.createObjectURL(file)
      }))
      
      setNewVariation({
        ...newVariation,
        images: [...newVariation.images, ...imageUrls]
      })
    }
  }

  const removeImageFromNewVariation = (index: number) => {
    const updatedImages = [...newVariation.images]
    updatedImages.splice(index, 1)
    
    const updatedFiles = [...selectedFiles]
    updatedFiles.splice(index, 1)
    
    setNewVariation({
      ...newVariation,
      images: updatedImages
    })
    setSelectedFiles(updatedFiles)
  }

  const addNewVariation = () => {
    // Vérifier d'abord si une variation équivalente existe déjà
    const hasEquivalent = normalizedVariations.some(variation => 
      areAttributesEquivalent(variation.attributes, newVariation.attributes)
    )
    
    if (hasEquivalent) {
      alert("Une variation avec ces attributs existe déjà.")
      return
    }
    
    onChange([...normalizedVariations, newVariation])
    setNewVariation({
      sku: '',
      price: 0, 
      inventory: 0,
      attributes: [],
      images: []
    })
    setSelectedFiles([])
    setShowDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Variations du produit</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button type="button" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une variation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Ajouter une variation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-sku">Référence (SKU)</Label>
                  <Input
                    id="new-sku"
                    value={newVariation.sku || ''}
                    onChange={(e) => handleNewVariationChange('sku', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-price">Prix</Label>
                  <Input
                    id="new-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newVariation.price || 0}
                    onChange={(e) => handleNewVariationChange('price', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                  <Label htmlFor="new-inventory">Stock</Label>
                  <Input
                    id="new-inventory"
                    type="number"
                    min="0"
                    value={newVariation.inventory || 0}
                    onChange={(e) => handleNewVariationChange('inventory', parseInt(e.target.value))}
                    required
                  />
                </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Attributs</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAttributeToNewVariation}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un attribut
                  </Button>
                </div>
                
                {newVariation.attributes.map((attr: ProductAttribute, attrIndex: number) => (
                  <div key={attrIndex} className="grid grid-cols-5 gap-4 items-center">
                    <div className="col-span-2">
                      <Combobox
                        options={attributeOptions}
                        value={attr.name}
                        onChange={(value) => handleNewAttributeChange(attrIndex, 'name', value)}
                        placeholder="Nom (ex: Couleur)"
                        emptyMessage="Aucun attribut trouvé"
                        searchPlaceholder="Rechercher un attribut..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Combobox
                        options={attributeValueOptions[attr.name.toLowerCase()] || []}
                        value={attr.value}
                        onChange={(value) => handleNewAttributeChange(attrIndex, 'value', value)}
                        placeholder="Valeur (ex: Rouge)"
                        emptyMessage="Aucune valeur trouvée"
                        searchPlaceholder="Rechercher une valeur..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttributeFromNewVariation(attrIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                {newVariation.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {newVariation.images.map((image: { path: string }, imgIndex: number) => (
                      <div key={imgIndex} className="relative h-24 w-24">
                        <Image
                          src={image.path}
                          alt="Variation preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full p-1"
                          onClick={() => removeImageFromNewVariation(imgIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button type="button" onClick={addNewVariation}>
                  Ajouter cette variation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {normalizedVariations.length > 0 ? (
        <div className="space-y-6">
          {normalizedVariations.map((variation, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between mb-4">
                <h4 className="font-medium">Variation #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => removeVariation(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor={`variation-${index}-sku`}>Référence (SKU)</Label>
                  <Input
                    id={`variation-${index}-sku`}
                    value={variation.sku || ''}
                    onChange={(e) => handleVariationChange(index, 'sku', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`variation-${index}-price`}>Prix</Label>
                  <Input
                    id={`variation-${index}-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={variation.price}
                    onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`variation-${index}-inventory`}>Stock</Label>
                  <Input
                    id={`variation-${index}-inventory`}
                    type="number"
                    min="0"
                    value={variation.inventory}
                    onChange={(e) => handleVariationChange(index, 'inventory', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Attributs</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAttributeToVariation(index)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un attribut
                  </Button>
                </div>
                {variation.attributes.length > 0 ? (
                  variation.attributes.map((attr: ProductAttribute, attrIndex: number) => (
                    <div key={attrIndex} className="grid grid-cols-5 gap-4 items-center">
                      <div className="col-span-2">
                        <Combobox
                          options={attributeOptions}
                          value={attr.name}
                          onChange={(value) => handleAttributeChange(index, attrIndex, 'name', value)}
                          placeholder="Nom (ex: Couleur)"
                          emptyMessage="Aucun attribut trouvé"
                          searchPlaceholder="Rechercher un attribut..."
                        />
                      </div>
                      <div className="col-span-2">
                        <Combobox
                          options={attributeValueOptions[attr.name.toLowerCase()] || []}
                          value={attr.value}
                          onChange={(value) => handleAttributeChange(index, attrIndex, 'value', value)}
                          placeholder="Valeur (ex: Rouge)"
                          emptyMessage="Aucune valeur trouvée"
                          searchPlaceholder="Rechercher une valeur..."
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttributeFromVariation(index, attrIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun attribut pour cette variation</p>
                )}
              </div>

              {variation.images && variation.images.length > 0 && (
                <div className="mt-4">
                  <Label>Images</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {variation.images.map((image: { path: string }, imgIndex: number) => (
                      <div key={imgIndex} className="relative h-24 w-24">
                        <Image
                          src={image.path}
                          alt="Variation image"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Aucune variation définie pour ce produit.</p>
      )}
    </div>
  )
} 
 