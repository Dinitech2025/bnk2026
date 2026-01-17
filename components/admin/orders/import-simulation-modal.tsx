'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plane, 
  Ship, 
  Package, 
  Calculator, 
  DollarSign, 
  Clock,
  Weight,
  AlertCircle,
  Plus,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface ImportSimulationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (item: ImportedItem) => void
}

interface ImportedItem {
  id: string
  itemType: 'PRODUCT' | 'SERVICE'
  name: string
  price: number
  weight: number
  description: string
  importData: any
}

interface FormData {
  mode: 'air' | 'sea'
  productName: string
  supplierPrice: string
  supplierCurrency: string
  weight: string
  warehouse: string
  volume: string
}

interface CalculationResult {
  productInfo: {
    name: string
    weight: number
    volume?: number
    mode: string
    warehouse: string
  }
  costs: {
    supplierPrice: {
      amount: number
      currency: string
      amountInMGA: number
    }
    transport: {
      amount: number
      currency: string
      amountInMGA: number
    }
    commission: {
      amount: number
      currency: string
      amountInMGA: number
      rate: number
    }
    fees: {
      processing: {
        amount: number
        currency: string
        amountInMGA: number
      }
      tax: {
        amount: number
        currency: string
        amountInMGA: number
        rate: number
      }
    }
    total: number
  }
  calculationMethod: string
  transitTime: string
}

const CURRENCIES = [
  { code: 'USD', name: 'Dollar US', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
  { code: 'CNY', name: 'Yuan Chinois', symbol: '¥' }
]

const AIR_WAREHOUSES = [
  { value: 'usa', label: 'États-Unis' },
  { value: 'france', label: 'France' },
  { value: 'uk', label: 'Royaume-Uni' }
]

const SEA_WAREHOUSES = [
  { value: 'france', label: 'France' },
  { value: 'china', label: 'Chine' }
]

export function ImportSimulationModal({ open, onOpenChange, onAddToCart }: ImportSimulationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    mode: 'air',
    productName: '',
    supplierPrice: '',
    supplierCurrency: 'USD',
    weight: '0',
    warehouse: 'france',
    volume: ''
  })

  const [calculation, setCalculation] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-calculer quand les données sont complètes
  useEffect(() => {
    if (open && shouldAutoCalculate()) {
      handleAutoCalculate()
    }
  }, [formData.supplierPrice, formData.weight, formData.volume, formData.mode])

  const shouldAutoCalculate = () => {
    const hasPrice = formData.supplierPrice && parseFloat(formData.supplierPrice) > 0
    const hasWeight = formData.weight !== undefined && formData.weight !== '' // Permettre poids = 0
    const hasVolume = formData.mode === 'air' || (formData.volume && parseFloat(formData.volume) > 0)
    
    return hasPrice && hasWeight && hasVolume
  }

  const handleAutoCalculate = async () => {
    if (!shouldAutoCalculate()) return

    setIsCalculating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/products/imported/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mode: formData.mode,
          supplierPrice: parseFloat(formData.supplierPrice),
          supplierCurrency: formData.supplierCurrency,
          weight: parseFloat(formData.weight),
          warehouse: formData.warehouse,
          volume: formData.mode === 'sea' ? parseFloat(formData.volume) : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du calcul')
      }

      const result = await response.json()
      setCalculation(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleAddToCart = () => {
    if (!calculation || !formData.productName.trim()) {
      toast.error('Veuillez remplir le nom du produit')
      return
    }

    const weight = parseFloat(formData.weight)
    
    // Si le poids est 0 ou non défini, c'est un service
    const itemType: 'PRODUCT' | 'SERVICE' = weight > 0 ? 'PRODUCT' : 'SERVICE'

    // Fonction pour arrondir à 100 Ar près (seulement pour le prix final)
    const roundToHundred = (value: number): number => {
      return Math.round(value / 100) * 100
    }

    // Calculer le prix suggéré avec une marge de 20% et arrondir seulement le prix final à 100 Ar
    const total = Number(calculation.costs.total)
    const suggestedPrice = roundToHundred(total * 1.2)

    const importedItem: ImportedItem = {
      id: `imported-${Date.now()}`,
      itemType,
      name: formData.productName,
      price: suggestedPrice,
      weight: weight,
      description: `Produit importé via transport ${formData.mode === 'air' ? 'aérien' : 'maritime'} depuis ${formData.warehouse}.\n\nCoût d'importation calculé: ${total.toLocaleString('fr-FR')} Ar\nDélai de livraison: ${calculation.transitTime}`,
      importData: {
        mode: formData.mode,
        warehouse: formData.warehouse,
        supplierPrice: calculation.costs.supplierPrice.amount,
        supplierCurrency: calculation.costs.supplierPrice.currency,
        transportCost: calculation.costs.transport.amountInMGA,
        commission: calculation.costs.commission.amountInMGA,
        vat: calculation.costs.fees.tax.amountInMGA,
        handlingFee: calculation.costs.fees.processing.amountInMGA,
        totalCost: calculation.costs.total,
        calculationDate: new Date().toISOString()
      }
    }

    onAddToCart(importedItem)
    toast.success(`${itemType === 'SERVICE' ? 'Service' : 'Produit'} importé ajouté au panier`)
    
    // Réinitialiser le formulaire
    setFormData({
      mode: 'air',
      productName: '',
      supplierPrice: '',
      supplierCurrency: 'USD',
      weight: '0',
      warehouse: 'france',
      volume: ''
    })
    setCalculation(null)
    onOpenChange(false)
  }

  const warehouses = formData.mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulateur d'Importation
          </DialogTitle>
          <DialogDescription>
            Calculez le coût d'importation et ajoutez directement le produit au panier
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulaire */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informations du produit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode de transport */}
                <div className="space-y-2">
                  <Label>Mode de transport</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formData.mode === 'air' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setFormData(prev => ({ ...prev, mode: 'air', warehouse: 'france' }))}
                    >
                      <Plane className="h-4 w-4 mr-2" />
                      Aérien
                    </Button>
                    <Button
                      type="button"
                      variant={formData.mode === 'sea' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setFormData(prev => ({ ...prev, mode: 'sea', warehouse: 'france' }))}
                    >
                      <Ship className="h-4 w-4 mr-2" />
                      Maritime
                    </Button>
                  </div>
                </div>

                {/* Nom du produit */}
                <div className="space-y-2">
                  <Label htmlFor="productName">Nom du produit *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                </div>

                {/* Prix fournisseur */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplierPrice">Prix fournisseur *</Label>
                    <Input
                      id="supplierPrice"
                      type="number"
                      step="0.01"
                      value={formData.supplierPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplierPrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierCurrency">Devise</Label>
                    <Select
                      value={formData.supplierCurrency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplierCurrency: value }))}
                    >
                      <SelectTrigger id="supplierCurrency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Poids */}
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg) *</Label>
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si le poids est 0, le produit sera considéré comme un service
                  </p>
                </div>

                {/* Volume (maritime uniquement) */}
                {formData.mode === 'sea' && (
                  <div className="space-y-2">
                    <Label htmlFor="volume">Volume (m³) *</Label>
                    <Input
                      id="volume"
                      type="number"
                      step="0.01"
                      value={formData.volume}
                      onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Entrepôt */}
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Entrepôt d'origine</Label>
                  <Select
                    value={formData.warehouse}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, warehouse: value }))}
                  >
                    <SelectTrigger id="warehouse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(wh => (
                        <SelectItem key={wh.value} value={wh.value}>
                          {wh.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {isCalculating ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Calcul en cours...</p>
                  </div>
                </CardContent>
              </Card>
            ) : calculation ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Résultat du calcul</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {calculation.transitTime}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Détails des coûts */}
                  {(() => {
                    // Fonction pour arrondir à 100 Ar près (seulement pour le prix final)
                    const roundToHundred = (value: number): number => {
                      return Math.round(value / 100) * 100
                    }

                    const transport = Number(calculation.costs.transport.amountInMGA)
                    const commission = Number(calculation.costs.commission.amountInMGA)
                    const tax = Number(calculation.costs.fees.tax.amountInMGA)
                    const processing = Number(calculation.costs.fees.processing.amountInMGA)
                    const total = Number(calculation.costs.total)
                    // Arrondir seulement le prix suggéré final à 100 Ar près
                    const suggestedPrice = roundToHundred(total * 1.2)

                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix fournisseur:</span>
                          <span className="font-medium">
                            {Math.round(Number(calculation.costs.supplierPrice.amount))} {calculation.costs.supplierPrice.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transport:</span>
                          <span className="font-medium">
                            {transport.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commission ({calculation.costs.commission.rate}%):</span>
                          <span className="font-medium">
                            {commission.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TVA ({calculation.costs.fees.tax.rate}%):</span>
                          <span className="font-medium">
                            {tax.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frais de gestion:</span>
                          <span className="font-medium">
                            {processing.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between text-base font-bold">
                          <span>Coût total:</span>
                          <span className="text-primary">
                            {total.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between text-base">
                          <span>Prix suggéré:</span>
                          <span className="font-bold text-green-600">
                            {suggestedPrice.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Marge bénéficiaire:</span>
                          <span>20%</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Type d'article */}
                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertDescription>
                      {parseFloat(formData.weight) > 0 ? (
                        <span className="font-medium">Produit physique</span>
                      ) : (
                        <span className="font-medium">Service (poids = 0)</span>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <Calculator className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Remplissez le formulaire pour calculer le coût
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!calculation || !formData.productName.trim()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter au panier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
