'use client'

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react"
import Image from "next/image"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Types pour les variations de produits
interface ProductAttribute {
  name: string
  value: string
}

interface ProductVariation {
  id?: string
  sku?: string
  price: number
  inventory: number
  attributes: ProductAttribute[]
  images: { path: string; id?: string }[]
}

interface VariationsFormEnhancedProps {
  variations: ProductVariation[]
  attributes: ProductAttribute[]
  onChange: (variations: ProductVariation[]) => void
  mainProductStock?: number
  onStockAlert?: (totalVariationStock: number) => void
}

export function VariationsFormEnhanced({ 
  variations, 
  attributes, 
  onChange,
  mainProductStock = 0,
  onStockAlert
}: VariationsFormEnhancedProps) {
  // Calcul du stock total des variations
  const totalVariationStock = useMemo(() => {
    return variations.reduce((sum, variation) => sum + (variation.inventory || 0), 0)
  }, [variations])

  // Alerte si le stock des variations dépasse le stock principal
  useEffect(() => {
    if (onStockAlert && totalVariationStock > mainProductStock && mainProductStock > 0) {
      onStockAlert(totalVariationStock)
    }
  }, [totalVariationStock, mainProductStock, onStockAlert])

  // Helper pour normaliser les attributs
  const normalizeAttributes = (attrs: ProductAttribute[]) => {
    return attrs.map(attr => ({
      ...attr,
      name: attr.name.trim().toLowerCase(),
      value: attr.value.trim()
    }))
  }

  // Helper pour vérifier si deux ensembles d'attributs sont équivalents
  const areAttributesEquivalent = (attrs1: ProductAttribute[], attrs2: ProductAttribute[]) => {
    if (attrs1.length !== attrs2.length) return false
    
    const normalized1 = normalizeAttributes(attrs1)
    const normalized2 = normalizeAttributes(attrs2)
    
    const sorted1 = [...normalized1].sort((a, b) => a.name.localeCompare(b.name))
    const sorted2 = [...normalized2].sort((a, b) => a.name.localeCompare(b.name))
    
    return sorted1.every((attr, idx) => 
      attr.name === sorted2[idx].name && 
      attr.value === sorted2[idx].value
    )
  }

  // S'assurer que toutes les variations ont un tableau images initialisé
  const normalizedVariations = variations.map(variation => ({
    ...variation,
    attributes: variation.attributes || [],
    images: variation.images || []
  }))

  // État pour le dialogue d'ajout
  const [showDialog, setShowDialog] = useState(false)
  const [newVariation, setNewVariation] = useState<ProductVariation>({
    sku: '',
    price: 0,
    inventory: 0,
    attributes: [],
    images: []
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  // État pour stocker les options de ComboBox
  const [attributeOptions, setAttributeOptions] = useState<ComboboxOption[]>([])
  const [attributeValueOptions, setAttributeValueOptions] = useState<{ [key: string]: ComboboxOption[] }>({})
  
  // Charger les attributs existants
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await fetch('/api/admin/products/attributes')
        if (response.ok) {
          const data = await response.json()
          const options = data.map((attr: { name: string, values: string[] }) => ({
            value: attr.name,
            label: attr.name.charAt(0).toUpperCase() + attr.name.slice(1)
          }))
          setAttributeOptions(options)
          
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

  // Handlers pour les variations existantes
  const handleVariationChange = (index: number, field: string, value: any) => {
    const updatedVariations = [...normalizedVariations]
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value
    }
    onChange(updatedVariations)
  }

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
        
        setAttributeValueOptions(prev => ({
          ...prev,
          [formattedValue]: []
        }))
      }
    } 
    else if (field === 'value' && formattedValue) {
      const attrName = attributes[attributeIndex].name.toLowerCase()
      if (!attrName) return
      
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

  // Handlers pour le dialogue d'ajout
  const handleNewVariationChange = (field: string, value: any) => {
    setNewVariation({
      ...newVariation,
      [field]: value
    })
  }

  const handleNewAttributeChange = (index: number, field: string, value: string) => {
    const attributes = [...newVariation.attributes]
    
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
        
        setAttributeValueOptions(prev => ({
          ...prev,
          [formattedValue]: []
        }))
      }
    } 
    else if (field === 'value' && formattedValue) {
      const attrName = attributes[index].name.toLowerCase()
      if (!attrName) return
      
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

  // Calculer la différence de stock
  const stockDifference = mainProductStock - totalVariationStock

  return (
    <div className="space-y-6">
      {/* Carte de résumé du stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Résumé du Stock
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de la gestion du stock et des variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stock principal */}
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Stock Principal</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{mainProductStock}</span>
                <Badge variant="outline">unités</Badge>
              </div>
            </div>

            {/* Stock des variations */}
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Stock Variations</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{totalVariationStock}</span>
                <Badge variant="outline">{normalizedVariations.length} variations</Badge>
              </div>
            </div>

            {/* Différence */}
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Différence</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${stockDifference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stockDifference > 0 ? '+' : ''}{stockDifference}
                </span>
                {stockDifference < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : stockDifference > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <Badge variant="outline">Égal</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Alerte si dépassement */}
          {totalVariationStock > mainProductStock && mainProductStock > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le stock total des variations ({totalVariationStock}) dépasse le stock principal ({mainProductStock}) de {totalVariationStock - mainProductStock} unités. 
                Veuillez ajuster les stocks pour éviter les incohérences.
              </AlertDescription>
            </Alert>
          )}

          {/* Info si stock équilibré */}
          {totalVariationStock === mainProductStock && mainProductStock > 0 && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <Package className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Le stock est parfaitement équilibré entre le produit principal et ses variations.
              </AlertDescription>
            </Alert>
          )}

          {/* Conseil si pas de variations */}
          {normalizedVariations.length === 0 && (
            <Alert className="mt-4">
              <AlertDescription>
                💡 Ajoutez des variations (tailles, couleurs, etc.) pour mieux gérer votre stock par attribut.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section des variations */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Variations du produit</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les différentes variantes de votre produit
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button type="button">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une variation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle variation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-sku">Référence (SKU)</Label>
                  <Input
                    id="new-sku"
                    value={newVariation.sku || ''}
                    onChange={(e) => handleNewVariationChange('sku', e.target.value)}
                    placeholder="VAR-001"
                  />
                </div>
                <div>
                  <Label htmlFor="new-price">Prix *</Label>
                  <Input
                    id="new-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newVariation.price || 0}
                    onChange={(e) => handleNewVariationChange('price', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-inventory">Stock *</Label>
                <Input
                  id="new-inventory"
                  type="number"
                  min="0"
                  value={newVariation.inventory || 0}
                  onChange={(e) => handleNewVariationChange('inventory', parseInt(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ce stock sera comptabilisé dans le stock total
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Attributs (Taille, Couleur, etc.)</Label>
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
                        placeholder="Nom (ex: Taille)"
                        emptyMessage="Aucun attribut trouvé"
                        searchPlaceholder="Rechercher..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Combobox
                        options={attributeValueOptions[attr.name.toLowerCase()] || []}
                        value={attr.value}
                        onChange={(value) => handleNewAttributeChange(attrIndex, 'value', value)}
                        placeholder="Valeur (ex: M)"
                        emptyMessage="Aucune valeur"
                        searchPlaceholder="Rechercher..."
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

                {newVariation.attributes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun attribut. Cliquez sur "Ajouter un attribut" pour commencer.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Images (optionnel)</Label>
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

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={addNewVariation}>
                  Ajouter cette variation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {normalizedVariations.length > 0 ? (
        <div className="grid gap-4">
          {normalizedVariations.map((variation, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      Variation #{index + 1}
                      {variation.sku && <Badge variant="outline" className="ml-2">{variation.sku}</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {variation.attributes.map(attr => `${attr.name}: ${attr.value}`).join(' • ') || 'Sans attributs'}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeVariation(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`variation-${index}-sku`}>Référence (SKU)</Label>
                    <Input
                      id={`variation-${index}-sku`}
                      value={variation.sku || ''}
                      onChange={(e) => handleVariationChange(index, 'sku', e.target.value)}
                      placeholder="VAR-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`variation-${index}-price`}>Prix *</Label>
                    <Input
                      id={`variation-${index}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={variation.price}
                      onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`variation-${index}-inventory`}>Stock *</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`variation-${index}-inventory`}
                        type="number"
                        min="0"
                        value={variation.inventory}
                        onChange={(e) => handleVariationChange(index, 'inventory', parseInt(e.target.value) || 0)}
                        required
                      />
                      <div className="flex items-center">
                        {variation.inventory > 0 ? (
                          <Badge variant="default" className="whitespace-nowrap">
                            {((variation.inventory / totalVariationStock) * 100).toFixed(0)}%
                          </Badge>
                        ) : (
                          <Badge variant="secondary">0%</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

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
                      Ajouter
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
                            placeholder="Nom"
                            emptyMessage="Aucun attribut"
                            searchPlaceholder="Rechercher..."
                          />
                        </div>
                        <div className="col-span-2">
                          <Combobox
                            options={attributeValueOptions[attr.name.toLowerCase()] || []}
                            value={attr.value}
                            onChange={(value) => handleAttributeChange(index, attrIndex, 'value', value)}
                            placeholder="Valeur"
                            emptyMessage="Aucune valeur"
                            searchPlaceholder="Rechercher..."
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
                    <p className="text-sm text-muted-foreground">Aucun attribut pour cette variation</p>
                  )}
                </div>

                {variation.images && variation.images.length > 0 && (
                  <div className="mt-4">
                    <Label className="mb-2 block">Images</Label>
                    <div className="grid grid-cols-4 gap-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-2">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune variation définie pour ce produit
              </p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur "Ajouter une variation" pour commencer
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




