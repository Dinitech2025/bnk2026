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
  Minus,
  ShoppingCart,
  RotateCcw,
  Eye,
  User,
  Trash2
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
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/lib/hooks/use-cart'

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

export default function DevisPage() {
  const router = useRouter()
  const { formatWithTargetCurrency, targetCurrency } = useCurrency()
  const { items: cartItems, addToCart, updateQuantity, removeFromCart: removeCartItem } = useCart()
  
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
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculer automatiquement dès que les champs requis sont remplis
  useEffect(() => {
    if (shouldAutoCalculate(formData)) {
      const timeoutId = setTimeout(() => {
        handleAutoCalculate()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.supplierPrice, formData.supplierCurrency, formData.weight, formData.warehouse, formData.mode, formData.volume])

  const shouldAutoCalculate = (data: FormData): boolean => {
    const hasSupplierPrice = data.supplierPrice && parseFloat(data.supplierPrice) > 0
    const hasValidWeight = data.weight !== undefined && data.weight !== null && 
                          !isNaN(parseFloat(data.weight) || 0) && 
                          (parseFloat(data.weight) || 0) >= 0
    const hasWarehouse = Boolean(data.warehouse)
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && data.volume && parseFloat(data.volume) > 0)
    
    return hasSupplierPrice && hasValidWeight && hasWarehouse && hasVolumeIfNeeded
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleModeChange = (mode: 'air' | 'sea') => {
    const warehouses = mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES
    const currentWarehouseExists = warehouses.some(w => w.value === formData.warehouse)
    
    setFormData(prev => ({
      ...prev,
      mode,
      warehouse: currentWarehouseExists ? prev.warehouse : warehouses[0].value,
      volume: mode === 'air' ? '' : prev.volume
    }))
  }

  const handleAutoCalculate = async () => {
    if (!validateForm(false)) return

    setIsCalculating(true)
    setError(null)

    try {
      const response = await fetch('/api/public/calculate-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: formData.mode,
          productName: formData.productName || 'Produit importé',
          productUrl: formData.productUrl || undefined,
          supplierPrice: parseFloat(formData.supplierPrice),
          supplierCurrency: formData.supplierCurrency,
          weight: parseFloat(formData.weight) || 0,
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
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du calcul')
    } finally {
      setIsCalculating(false)
    }
  }

  const validateForm = (requireProductName: boolean = false): boolean => {
    if (requireProductName && !formData.productName.trim()) {
      setError('Le nom du produit est requis')
      return false
    }
    
    if (requireProductName && !formData.productUrl.trim()) {
      setError('L\'URL du produit est requise')
      return false
    }
    
    if (!formData.supplierPrice || parseFloat(formData.supplierPrice) <= 0) {
      setError('Le prix fournisseur doit être supérieur à 0')
      return false
    }
    
    // Accepter le poids 0 et les valeurs vides (qui deviennent 0)
    const weightValue = parseFloat(formData.weight) || 0
    if (isNaN(weightValue) || weightValue < 0) {
      setError('Le poids doit être un nombre positif ou zéro')
      return false
    }
    
    if (formData.mode === 'sea' && (!formData.volume || parseFloat(formData.volume) <= 0)) {
      setError('Le volume est requis pour le transport maritime')
      return false
    }
    
    return true
  }

  const handleAddToCart = async () => {
    if (!calculation) {
      toast.error('Veuillez d\'abord effectuer un calcul')
      return
    }

    if (!formData.productName.trim()) {
      setError('Le nom du produit est requis pour l\'ajouter au panier')
      return
    }

    setIsAddingToCart(true)

    try {
      // Étape 1: Créer le produit dans la base de données
      toast.info('Création du produit en cours...')
      
      const createProductResponse = await fetch('/api/public/create-product-from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: {
            name: formData.productName,
            url: formData.productUrl || undefined,
            weight: calculation.productInfo.weight,
            volume: calculation.productInfo.volume,
            mode: calculation.productInfo.mode,
            warehouse: calculation.productInfo.warehouse
          },
          costs: calculation.costs,
          calculationMethod: calculation.calculationMethod,
          transitTime: calculation.transitTime
        })
      })

      if (!createProductResponse.ok) {
        const errorData = await createProductResponse.json()
        throw new Error(errorData.error || 'Erreur lors de la création du produit')
      }

      const { product } = await createProductResponse.json()

            // Étape 2: Ajouter le produit créé au panier via la base de données
      await addToCart({
        type: 'product',
        itemId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: null,
        data: {
          sku: product.sku,
          description: product.description,
          category: product.category,
          weight: product.weight ? parseFloat(product.weight) : undefined,
          attributes: product.attributes
        }
      })

      toast.success(`"${product.name}" a été créé et ajouté au panier`)

      // Réinitialiser le formulaire
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
      setCalculation(null)

    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout au panier')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const resetForm = () => {
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
    setCalculation(null)
    setError(null)
  }

  // Fonctions pour gérer le panier avec la base de données
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeCartItem(cartItemId)
        return
      }
      await updateQuantity(cartItemId, newQuantity)
      toast.success('Quantité mise à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      console.error('Erreur lors de la mise à jour de la quantité:', error)
    }
  }

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      await removeCartItem(cartItemId)
      toast.success('Article supprimé du panier')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error('Erreur lors de la suppression du panier:', error)
    }
  }

  const availableWarehouses = formData.mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="pt-6 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Faire un devis d'importation</h1>
            <p className="text-gray-600 mt-2">
              Calculez le coût d'importation de vos produits et ajoutez-les directement à votre panier
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">
            {/* Formulaire */}
            <Card className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-base">
                  <Calculator className="h-4 w-4" />
                  Simulation d'importation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Section 1: Transport */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Mode de transport</Label>
                  <Tabs value={formData.mode} onValueChange={(value) => handleModeChange(value as 'air' | 'sea')}>
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="air" className="flex items-center gap-1 text-sm">
                        <Plane className="h-3 w-3" />
                        Aérien
                      </TabsTrigger>
                      <TabsTrigger value="sea" className="flex items-center gap-1 text-sm">
                        <Ship className="h-3 w-3" />
                        Maritime
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Section 2: Entrepôt */}
                <div className="space-y-2">
                  <Label htmlFor="warehouse" className="text-sm font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Entrepôt de départ
                  </Label>
                  <Select 
                    value={formData.warehouse} 
                    onValueChange={(value) => handleInputChange('warehouse', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWarehouses.map((warehouse) => (
                        <SelectItem key={warehouse.value} value={warehouse.value}>
                          {warehouse.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Section 3: Informations produit */}
                <div className="space-y-2">
                  <Label htmlFor="productName" className="text-sm font-semibold">Nom du produit *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Ex: iPhone 15 Pro Max"
                    className="h-9"
                  />
                  
                  <Label htmlFor="productUrl" className="text-sm font-semibold">URL du produit *</Label>
                  <Input
                    id="productUrl"
                    value={formData.productUrl}
                    onChange={(e) => handleInputChange('productUrl', e.target.value)}
                    placeholder="https://..."
                    className="h-9"
                  />
                </div>

                {/* Section 4: Prix et devise */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Prix fournisseur</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="supplierPrice" className="text-sm">Prix</Label>
                      <Input
                        id="supplierPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.supplierPrice}
                        onChange={(e) => handleInputChange('supplierPrice', e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="supplierCurrency" className="text-sm">Devise</Label>
                      <Select 
                        value={formData.supplierCurrency} 
                        onValueChange={(value) => handleInputChange('supplierCurrency', value)}
                      >
                        <SelectTrigger className="h-9">
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
                </div>

                {/* Section 5: Dimensions */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Dimensions et poids</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="weight" className="text-sm flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        Poids (kg)
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="0.0"
                        className="h-9"
                      />
                    </div>

                    {formData.mode === 'sea' && (
                      <div>
                        <Label htmlFor="volume" className="text-sm flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          Volume (m³) *
                        </Label>
                        <Input
                          id="volume"
                          type="number"
                          step="0.001"
                          min="0"
                          value={formData.volume}
                          onChange={(e) => handleInputChange('volume', e.target.value)}
                          placeholder="0.000"
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Résultat et actions intégrés */}
                {isCalculating && (
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="flex items-center justify-center py-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-blue-700 text-xs font-medium">Calcul en cours...</span>
                    </div>
                  </div>
                )}

                {calculation && (
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 shadow-sm">
                    {/* En-tête avec icône */}
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-base font-bold text-green-800">Résultat du calcul</span>
                    </div>
                    
                    {/* Prix final en grand */}
                    <div className="bg-white rounded-lg p-3 mb-3 border border-green-300">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Prix de vente final</div>
                        <div className="text-2xl font-bold text-primary">
                          <PriceWithConversion price={Math.round(calculation.costs.total / 100) * 100} />
                        </div>
                      </div>
                    </div>
                    

                    
                    {/* Informations de transport */}
                    <div className="flex items-center justify-between text-sm text-green-700 pt-2 border-t border-green-200">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{calculation.transitTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {calculation.productInfo.mode === 'air' ? 
                          <Plane className="h-4 w-4" /> : 
                          <Ship className="h-4 w-4" />
                        }
                        <span className="font-medium">
                          {calculation.productInfo.mode === 'air' ? 'Transport aérien' : 'Transport maritime'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                  
                  {calculation && (
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || !formData.productName.trim() || !formData.productUrl.trim()}
                      className="flex items-center gap-1 ml-auto"
                      size="sm"
                      variant="danger"
                    >
                      {isAddingToCart ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Ajouter au panier
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Colonne de droite */}
            <div className="space-y-6">
              {/* Mini Panier */}
              <Card className="h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Panier en cours
                    {cartItems.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {cartItems.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Debug: {cartItems.length} articles
                    </div>
                  )}
                  <CardDescription>
                    Articles ajoutés à votre panier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cartItems.length > 0 ? (
                    <div className="space-y-4">
                      {/* Articles du panier - Version compacte */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {cartItems.map((item, index) => (
                          <div key={index} className="p-2 rounded border bg-gray-50">
                            <div className="flex items-center gap-2">
                              {/* Image compacte */}
                              {item.image ? (
                                <div className="relative h-8 w-8 flex-shrink-0">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="object-cover rounded w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 bg-gray-200 rounded flex-shrink-0"></div>
                              )}

                              <div className="flex-1 min-w-0">
                                {/* Ligne 1: Nom + Badge */}
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {item.name}
                                    </p>
                                    {item.type === 'service' && (
                                      <Badge variant="secondary" className="text-xs px-1 py-0">
                                        Service
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRemoveFromCart(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Ligne 2: Prix unitaire + Total */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-primary">
                                    <PriceWithConversion price={item.price} />
                                  </span>
                                  <span className="text-xs font-medium">
                                    <PriceWithConversion price={item.price * item.quantity} />
                                  </span>
                                </div>

                                {/* Ligne 3: Contrôles de quantité */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    >
                                      <Minus className="h-2 w-2" />
                                    </Button>
                                    <span className="text-xs font-medium min-w-[15px] text-center">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    >
                                      <Plus className="h-2 w-2" />
                                    </Button>
                                  </div>
                                  
                                  {/* Détails du type d'article */}
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="capitalize">{item.type}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Total du panier - Version compacte */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Sous-total</span>
                          <span className="font-medium">
                            <PriceWithConversion 
                              price={cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)} 
                            />
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Livraison</span>
                          <span>Gratuite</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold">
                          <span>Total</span>
                          <span className="text-primary">
                            <PriceWithConversion 
                              price={cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)} 
                            />
                          </span>
                        </div>

                        {/* Note pour les services - compacte */}
                        {cartItems.some(item => item.type === 'service') && (
                          <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                            <p className="font-medium">ℹ️ Services inclus dans votre commande</p>
                          </div>
                        )}

                        {/* Actions - compactes */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button 
                            onClick={() => router.push('/checkout')} 
                            className="w-full text-xs" 
                            size="sm"
                          >
                            Commander
                          </Button>
                          <Button 
                            onClick={() => router.push('/cart')} 
                            variant="outline" 
                            className="w-full text-xs" 
                            size="sm"
                          >
                            Voir tout
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Votre panier est vide</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ajoutez des produits calculés
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 