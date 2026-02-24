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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plane, 
  Ship, 
  Package, 
  Calculator, 
  DollarSign, 
  Clock,
  MapPin,
  Weight,
  Ruler,
  AlertCircle,
  CheckCircle,
  Plus,
  ExternalLink,
  RotateCcw,
  Eye
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice } from '@/lib/utils'
import { useCurrency } from '@/lib/hooks/use-currency'
import Link from 'next/link'

interface FormData {
  mode: 'air' | 'sea'
  productName: string
  productUrl: string
  supplierPrice: string
  supplierCurrency: string
  weight: string
  warehouse: string
  volume: string
}

interface CalculationResult {
  productInfo: {
    name: string
    url?: string
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
      details: string
    }
    commission: {
      amount: number
      currency: string
      amountInMGA: number
      rate: number
      details: string
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
  { code: 'CNY', name: 'Yuan Chinois', symbol: '¥' },
  { code: 'MGA', name: 'Ariary', symbol: 'Ar' }
]

const AIR_WAREHOUSES = [
  { value: 'usa', label: 'États-Unis', currency: 'USD' },
  { value: 'france', label: 'France', currency: 'EUR' },
  { value: 'uk', label: 'Royaume-Uni', currency: 'GBP' }
]

const SEA_WAREHOUSES = [
  { value: 'france', label: 'France', currency: 'EUR' },
  { value: 'china', label: 'Chine', currency: 'USD' }
]

export default function ImportSimulationPage() {
  const { formatWithTargetCurrency, targetCurrency } = useCurrency()
  
  const [formData, setFormData] = useState<FormData>({
    mode: 'air',
    productName: '',
    productUrl: '',
    supplierPrice: '',
    supplierCurrency: 'USD',
    weight: '0',
    warehouse: 'france',
    volume: ''
  })

  const [calculation, setCalculation] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdProduct, setCreatedProduct] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalProductName, setModalProductName] = useState('')
  const [modalProductUrl, setModalProductUrl] = useState('')
  const [modalProductSpecs, setModalProductSpecs] = useState('')

  // Déclencher le calcul automatique dès le chargement si les conditions sont remplies
  useEffect(() => {
    if (shouldAutoCalculate(formData)) {
      handleAutoCalculate()
    }
  }, []) // Une seule fois au chargement

  // Déclencher le calcul automatique à chaque changement de formData
  useEffect(() => {
    if (shouldAutoCalculate(formData)) {
      console.log('🔥 useEffect: Déclenchement du calcul automatique')
      const timeoutId = setTimeout(() => {
        handleAutoCalculate()
      }, 200) // Délai pour éviter les appels trop fréquents
      
      return () => clearTimeout(timeoutId)
    }
  }, [formData.supplierPrice, formData.weight, formData.warehouse, formData.mode, formData.volume])

  // Fonction pour arrondir les prix en Ariary à l'ordre de 100 Ar
  const roundToHundred = (amount: number): number => {
    return Math.round(amount / 100) * 100
  }

  // Fonction pour formater les prix selon la devise sélectionnée
  const formatDisplayPrice = (priceInMGA: number, originalAmount?: number, originalCurrency?: string) => {
    // Arrondir le prix en MGA à l'ordre de 100 Ar
    const roundedPriceInMGA = roundToHundred(priceInMGA)
    
    // Si on a les valeurs originales et que la devise sélectionnée correspond
    if (originalAmount && originalCurrency && targetCurrency === originalCurrency) {
      const symbol = originalCurrency === 'EUR' ? '€' : 
                    originalCurrency === 'USD' ? '$' : 
                    originalCurrency === 'GBP' ? '£' : originalCurrency
      return `${originalAmount.toLocaleString('fr-FR')} ${symbol}`
    }
    
    // Sinon, utiliser la conversion depuis MGA (avec arrondi)
    if (targetCurrency && targetCurrency !== 'MGA') {
      return formatWithTargetCurrency(roundedPriceInMGA, targetCurrency)
    }
    return formatPrice(roundedPriceInMGA, 'MGA', 'Ar')
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    setError(null)
    
    // Debug logs
    console.log('🔄 Changement de champ:', field, '=', value)
    console.log('📋 Nouveau formData:', newFormData)
    
    // Vérifier immédiatement si on peut calculer
    const canCalculate = shouldAutoCalculate(newFormData)
    console.log('✅ Peut calculer automatiquement:', canCalculate)
    
    if (canCalculate) {
      console.log('🚀 Déclenchement du calcul automatique...')
      // Délai très court pour laisser l'état se mettre à jour
      setTimeout(() => {
        handleAutoCalculate()
      }, 100)
    }
  }

  // Fonction pour vérifier si le calcul automatique peut être déclenché
  const shouldAutoCalculate = (data: FormData): boolean => {
    // Variables nécessaires pour le calcul (sans nom et URL)
    const hasSupplierPrice = Boolean(data.supplierPrice) && !isNaN(parseFloat(data.supplierPrice)) && parseFloat(data.supplierPrice) > 0
    const hasWeight = data.weight !== '' && data.weight !== undefined && !isNaN(parseFloat(data.weight)) // Accepter toute valeur numérique, y compris 0
    const hasWarehouse = Boolean(data.warehouse)
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && Boolean(data.volume) && !isNaN(parseFloat(data.volume)) && parseFloat(data.volume) > 0)
    
    // Debug logs détaillés
    console.log('🔍 Vérification des conditions:')
    console.log('   💰 Prix fournisseur:', data.supplierPrice, '→', hasSupplierPrice)
    console.log('   ⚖️ Poids:', data.weight, '→', hasWeight)
    console.log('   🏢 Entrepôt:', data.warehouse, '→', hasWarehouse)
    console.log('   📦 Volume (si maritime):', data.mode, data.volume, '→', hasVolumeIfNeeded)
    
    const hasRequiredFields = hasSupplierPrice && hasWeight && hasWarehouse && hasVolumeIfNeeded
    console.log('🎯 Toutes conditions remplies:', hasRequiredFields)
    
    return hasRequiredFields
  }

  const handleModeChange = (mode: 'air' | 'sea') => {
    // Garder l'entrepôt s'il est compatible avec le nouveau mode
    let newWarehouse = formData.warehouse
    const currentWarehouses = mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES
    const isWarehouseCompatible = currentWarehouses.some(w => w.value === formData.warehouse)
    
    if (!isWarehouseCompatible) {
      newWarehouse = ''
    }
    
    const newFormData = { 
      ...formData, 
      mode, 
      warehouse: newWarehouse,
      volume: mode === 'air' ? '' : formData.volume
    }
    
    setFormData(newFormData)
    setCalculation(null)
    setError(null)
    
    // Déclencher le calcul automatique si possible
    if (shouldAutoCalculate(newFormData)) {
      setTimeout(() => handleAutoCalculate(), 50)
    }
  }

  const validateForm = (requireProductName: boolean = true): boolean => {
    // Le nom de produit n'est plus requis pour le calcul
    if (!formData.supplierPrice || isNaN(parseFloat(formData.supplierPrice)) || parseFloat(formData.supplierPrice) <= 0) {
      setError('Le prix fournisseur doit être supérieur à 0')
      return false
    }
    if (formData.weight === '' || formData.weight === undefined || isNaN(parseFloat(formData.weight))) {
      setError('Le poids est requis (peut être 0)')
      return false
    }
    if (!formData.warehouse) {
      setError('Veuillez sélectionner un entrepôt')
      return false
    }
    if (formData.mode === 'sea' && (!formData.volume || parseFloat(formData.volume) <= 0)) {
      setError('Le volume est requis pour le transport maritime')
      return false
    }
    return true
  }

  const performCalculation = async (requireProductName: boolean = true) => {
    if (!validateForm(requireProductName)) return

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

  // Fonction pour le calcul manuel (bouton)
  const handleCalculate = async () => {
    await performCalculation(true)
  }

  // Fonction pour le calcul automatique
  const handleAutoCalculate = async () => {
    console.log('🎬 handleAutoCalculate démarré')
    await performCalculation(false)
    console.log('🏁 handleAutoCalculate terminé')
  }

  const handleOpenCreateModal = () => {
    if (!calculation) return
    setModalProductName('')
    setModalProductUrl('')
    setModalProductSpecs('')
    setShowCreateModal(true)
  }

  const handleCreateProduct = async () => {
    if (!calculation || !modalProductName.trim() || !modalProductUrl.trim()) return

    try {
      setIsCreatingProduct(true)
      setError(null)

              // Créer une copie du calcul avec les nouvelles informations produit
        const calculationWithProductInfo = {
          ...calculation,
          productInfo: {
            ...calculation.productInfo,
            name: modalProductName.trim(),
            url: modalProductUrl.trim(),
            specifications: modalProductSpecs.trim()
          }
        }

      const response = await fetch('/api/admin/products/create-from-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calculationWithProductInfo)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du produit')
      }

      // Succès - sauvegarder les infos du produit créé
      setCreatedProduct(data.product)
      setShowCreateModal(false)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du produit')
    } finally {
      setIsCreatingProduct(false)
    }
  }

  const currentWarehouses = formData.mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulation d'importation</h1>
          <p className="text-muted-foreground">
            Calculez les coûts d'importation pour vos produits par voie aérienne ou maritime.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products/imported">
            <Package className="h-4 w-4 mr-2" />
            Voir les produits importés
          </Link>
        </Button>
      </div>
            
      {targetCurrency && targetCurrency !== 'MGA' && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Affichage en {targetCurrency}</strong> : Les prix sont automatiquement convertis selon la devise sélectionnée dans l'en-tête. 
            Changez la devise dans le sélecteur en haut à droite pour voir les prix dans d'autres devises.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de saisie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Paramètres d'importation
            </CardTitle>
            <CardDescription>
              Saisissez les informations de votre produit pour calculer les coûts d'importation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection du mode de transport */}
            <div>
              <Label className="text-base font-medium">Mode de transport</Label>
              <Tabs value={formData.mode} onValueChange={(value) => handleModeChange(value as 'air' | 'sea')} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="air" className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Aérien
                  </TabsTrigger>
                  <TabsTrigger value="sea" className="flex items-center gap-2">
                    <Ship className="h-4 w-4" />
                    Maritime
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>



            {/* Prix et devise */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierPrice">Prix fournisseur *</Label>
                <Input
                  id="supplierPrice"
                  type="number"
                  step="0.01"
                  value={formData.supplierPrice}
                  onChange={(e) => handleInputChange('supplierPrice', e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="supplierCurrency">Devise</Label>
                <Select value={formData.supplierCurrency} onValueChange={(value) => handleInputChange('supplierCurrency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Poids et volume */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Poids (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.0 (peut être 0)"
                  className="mt-1"
                />
              </div>
              {formData.mode === 'sea' && (
                <div>
                  <Label htmlFor="volume" className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Volume (m³) *
                  </Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => handleInputChange('volume', e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Entrepôt de collecte */}
            <div>
              <Label htmlFor="warehouse" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Entrepôt de collecte *
              </Label>
              <Select value={formData.warehouse} onValueChange={(value) => handleInputChange('warehouse', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un entrepôt" />
                </SelectTrigger>
                <SelectContent>
                  {currentWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.value} value={warehouse.value}>
                      {warehouse.label} ({warehouse.currency})
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

            <Button 
              onClick={handleCalculate} 
              disabled={isCalculating}
              className="w-full"
              size="lg"
            >
              {isCalculating ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculer les coûts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Résultats du calcul
              {targetCurrency && targetCurrency !== 'MGA' && (
                <Badge variant="secondary" className="ml-2">
                  Affiché en {targetCurrency}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Détail des coûts d'importation jusqu'à Madagascar.
              {targetCurrency && targetCurrency !== 'MGA' && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Les prix sont convertis depuis MGA selon le taux de change sélectionné.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!calculation ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Remplissez le formulaire et le calcul se fera automatiquement.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Informations produit */}
                <div>
                  <h3 className="font-semibold mb-3">Informations produit</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nom:</span>
                      <span className="font-medium">{calculation.productInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport:</span>
                      <Badge variant={calculation.productInfo.mode === 'air' ? 'default' : 'secondary'}>
                        {calculation.productInfo.mode === 'air' ? (
                          <>
                            <Plane className="h-3 w-3 mr-1" />
                            Aérien
                          </>
                        ) : (
                          <>
                            <Ship className="h-3 w-3 mr-1" />
                            Maritime
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrepôt:</span>
                      <span className="font-medium">{calculation.productInfo.warehouse}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Poids:</span>
                      <span className="font-medium">{calculation.productInfo.weight} kg</span>
                    </div>
                    {calculation.productInfo.volume && (
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span className="font-medium">{calculation.productInfo.volume} m³</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Délai:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculation.transitTime}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Détail des coûts */}
                <div>
                  <h3 className="font-semibold mb-3">Détail des coûts</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Prix fournisseur:</span>
                      <span className="font-medium">
                        {formatDisplayPrice(
                          calculation.costs.supplierPrice.amountInMGA,
                          calculation.costs.supplierPrice.amount,
                          calculation.costs.supplierPrice.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport:</span>
                      <span className="font-medium">
                        {formatDisplayPrice(
                          calculation.costs.transport.amountInMGA,
                          calculation.costs.transport.amount,
                          calculation.costs.transport.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission ({calculation.costs.commission.rate}%):</span>
                      <span className="font-medium">
                        {formatDisplayPrice(
                          calculation.costs.commission.amountInMGA,
                          calculation.costs.commission.amount,
                          calculation.costs.commission.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de traitement:</span>
                      <span className="font-medium">
                        {formatDisplayPrice(
                          calculation.costs.fees.processing.amountInMGA,
                          calculation.costs.fees.processing.amount,
                          calculation.costs.fees.processing.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxe ({calculation.costs.fees.tax.rate}%):</span>
                      <span className="font-medium">
                        {formatDisplayPrice(
                          calculation.costs.fees.tax.amountInMGA,
                          calculation.costs.fees.tax.amount,
                          calculation.costs.fees.tax.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Coût total */}
                <div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Coût total d'importation:</span>
                    <span className="text-blue-600">
                      {formatDisplayPrice(calculation.costs.total)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ce montant représente le coût total pour importer ce produit jusqu'à Madagascar.
                  </p>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  {!createdProduct ? (
                    <>
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Calcul terminé ! Vous pouvez maintenant créer ce produit dans votre catalogue.
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        onClick={handleOpenCreateModal} 
                        disabled={isCreatingProduct}
                        className="w-full" 
                        size="lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer le produit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Produit créé avec succès !</strong><br />
                          {createdProduct.name} (SKU: {createdProduct.sku}) a été ajouté à votre catalogue.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button 
                          onClick={() => window.open(`/admin/products/${createdProduct.id}/edit`, '_blank')}
                          variant="default"
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le produit
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            setCreatedProduct(null)
                            setCalculation(null)
                            setFormData({
                              mode: 'air',
                              productName: '',
                              productUrl: '',
                              supplierPrice: '',
                              supplierCurrency: 'USD',
                              weight: '0',
                              warehouse: 'france',
                              volume: ''
                            })
                            setModalProductName('')
                            setModalProductUrl('')
                            setModalProductSpecs('')
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Nouvelle simulation
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={() => window.open('/admin/products/imported', '_blank')}
                        variant="secondary"
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir tous les produits importés
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de création de produit */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer le produit</DialogTitle>
            <DialogDescription>
              Ajoutez les informations finales pour créer ce produit dans votre catalogue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
                         <div>
               <Label htmlFor="modal-productName" className="text-sm font-medium">
                 Nom du produit * (max 100 caractères)
               </Label>
               <Input
                 id="modal-productName"
                 value={modalProductName}
                 onChange={(e) => {
                   const value = e.target.value
                   if (value.length <= 100) {
                     setModalProductName(value)
                   }
                 }}
                 placeholder="Ex: iPhone 15 Pro Max"
                 className="mt-1"
                 maxLength={100}
               />
               <p className="text-xs text-gray-500 mt-1">
                 {modalProductName.length}/100 caractères
               </p>
             </div>

             <div>
               <Label htmlFor="modal-productUrl" className="text-sm font-medium">
                 URL du produit *
               </Label>
               <Input
                 id="modal-productUrl"
                 value={modalProductUrl}
                 onChange={(e) => setModalProductUrl(e.target.value)}
                 placeholder="https://..."
                 className="mt-1"
                 required
               />
             </div>

             <div>
               <Label htmlFor="modal-productSpecs" className="text-sm font-medium">
                 Spécifications du produit (optionnel)
               </Label>
               <textarea
                 id="modal-productSpecs"
                 value={modalProductSpecs}
                 onChange={(e) => setModalProductSpecs(e.target.value)}
                 placeholder="Ex: Couleur, taille, modèle, caractéristiques techniques..."
                 className="mt-1 w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 rows={3}
               />
               <p className="text-xs text-gray-500 mt-1">
                 Décrivez les spécifications techniques ou caractéristiques importantes du produit
               </p>
             </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
              disabled={isCreatingProduct}
            >
              Annuler
            </Button>
                         <Button 
               onClick={handleCreateProduct}
               disabled={isCreatingProduct || !modalProductName.trim() || !modalProductUrl.trim()}
             >
              {isCreatingProduct ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


































