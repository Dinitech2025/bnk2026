'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CreditCard, Phone, Mail, MapPin, Users, Clock, CheckCircle, Truck, User, Plus, Edit3, Building } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector-simple'
import { DeliveryOptions } from '@/components/checkout/delivery-options'
import { AuthModal } from '@/components/auth/auth-modal'
import { PromoCodeInput } from '@/components/checkout/promo-code-input'
import { OrderSummary } from '@/components/checkout/order-summary'
import { useCurrency } from '@/lib/contexts/currency-context'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  type?: string
  platform?: {
    id: string
    name: string
    logo: string | null
  }
  duration?: string
  maxProfiles?: number
  reservation?: any
}

interface OrderData {
  items: OrderItem[]
  total: number
  currency: string
}

interface UserAddress {
  id: string
  type: string
  street: string
  city: string
  zipCode: string
  country: string
  isDefault: boolean
  phoneNumber?: string | null
}

interface PromoCode {
  id: string
  code: string
  name: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  description?: string
}

export default function CheckoutContent() {
  const { data: session, status } = useSession()
  const { currency, targetCurrency, formatWithTargetCurrency, exchangeRates } = useCurrency()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sameAsbilling, setSameAsBinding] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [isProcessingPayPalReturn, setIsProcessingPayPalReturn] = useState(false)
  const [showAuthRequired, setShowAuthRequired] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Helper pour convertir les prix (utilise les taux du système)
  const convertPrice = (price: number, targetCurrency?: string) => {
    if (!targetCurrency || targetCurrency === currency) return price
    
    // Utiliser les taux du système (exchangeRates du contexte)
    const rate = exchangeRates[targetCurrency]
    return rate ? price * rate : price
  }

  // Gérer les changements de mode de livraison
  const handleDeliveryChange = (delivery: any) => {
    setSelectedDelivery(delivery)
    setDeliveryCost(delivery?.price || 0)
    console.log('🚚 Mode de livraison sélectionné:', delivery)
  }

  // Calculer le total avec frais de livraison et promotions
  const getTotalWithDelivery = () => {
    const baseTotal = orderData?.total || 0
    const finalDeliveryCost = (appliedPromo?.type === 'FREE_SHIPPING') ? 0 : deliveryCost
    return baseTotal - discountAmount + finalDeliveryCost
  }

  // Gérer l'application d'un code promo
  const handlePromoApplied = (promo: PromoCode, discount: number) => {
    setAppliedPromo(promo)
    setDiscountAmount(discount)
    console.log('🎯 Code promo appliqué:', promo.code, 'Réduction:', discount)
  }

  // Gérer la suppression d'un code promo
  const handlePromoRemoved = () => {
    setAppliedPromo(null)
    setDiscountAmount(0)
    console.log('🗑️ Code promo retiré')
  }

  // Données du formulaire étendues
  const [formData, setFormData] = useState({
    // Informations personnelles
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    // SUPPRIMÉ: password (déclenchait alerte Google Safe Browsing)
    
    // Adresse de facturation
    billingAddress: '',
    billingCity: '',
    billingZipCode: '',
    billingCountry: 'Madagascar',
    selectedBillingAddressId: '', // Nouvelle: pour sélectionner une adresse existante
    
    // Adresse de livraison
    shippingAddress: '',
    shippingCity: '',
    shippingZipCode: '',
    shippingCountry: 'Madagascar',
    selectedShippingAddressId: '', // Nouvelle: pour sélectionner une adresse existante
    
    // Notes seulement - paiement géré par PaymentMethodSelector
    notes: '',
    
    // Options de compte - SÉCURISÉ
    hasAccount: false, // Toggle connexion/création
    newsletter: false
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Gérer les retours PayPal
  useEffect(() => {
    if (!isMounted) return

    const paypalReturn = searchParams.get('paypal_return')
    const paymentType = searchParams.get('payment_type')

    if (paypalReturn === 'success' && paymentType) {
      console.log('🎉 Retour PayPal détecté - Traitement du paiement...')
      handlePayPalReturn()
    } else if (paypalReturn === 'cancel') {
      console.log('❌ Paiement PayPal annulé')
      toast({
        title: "Paiement annulé",
        description: "Votre paiement PayPal a été annulé. Vous pouvez réessayer.",
        variant: "default"
      })
      // Nettoyer l'URL
      router.replace('/checkout')
    }
  }, [isMounted, searchParams])

  const handlePayPalReturn = async () => {
    setIsProcessingPayPalReturn(true)

    try {
      // Récupérer les données stockées
      const checkoutData = localStorage.getItem('paypal_checkout_data')
      const pendingOrderId = localStorage.getItem('paypal_pending_order_id')

      if (!checkoutData || !pendingOrderId) {
        throw new Error('Données de commande manquantes')
      }

      const orderData = JSON.parse(checkoutData)
      console.log('🔄 Traitement retour PayPal:', {
        orderId: pendingOrderId,
        paymentType: orderData.paymentType
      })

      // Capturer le paiement PayPal
      const captureResponse = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: pendingOrderId,
          orderData
        }),
      })

      const captureResult = await captureResponse.json()

      if (captureResult.status === 'COMPLETED') {
        console.log('✅ Paiement PayPal capturé avec succès')

        // Créer la commande en base de données
        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...orderData,
            paymentData: {
              method: orderData.paymentType,
              status: 'completed',
              transactionId: captureResult.id,
              paypalOrderId: pendingOrderId,
              amount: orderData.paypalAmount,
              currency: orderData.paypalCurrency
            }
          }),
        })

        if (!createOrderResponse.ok) {
          throw new Error('Erreur lors de la création de la commande')
        }

        const orderCreated = await createOrderResponse.json()
        console.log('✅ Commande créée:', orderCreated.order.orderNumber)

        // Vider le panier
        await fetch('/api/cart/clear', { method: 'POST' })
        localStorage.removeItem('cart')

        // Décrémenter l'inventaire
        for (const item of orderData.items) {
          try {
            await fetch('/api/inventory/decrement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: item.productId || item.id,
                quantity: item.quantity
              })
            })
          } catch (error) {
            console.warn('Erreur décrémentation inventaire:', error)
          }
        }

        // Nettoyer le localStorage
        localStorage.removeItem('paypal_checkout_data')
        localStorage.removeItem('paypal_pending_order_id')
        localStorage.removeItem('paypal_checkout_callbacks')
        localStorage.removeItem('pendingOrder')

        // Rediriger vers la page de succès
        const successParams = new URLSearchParams({
          orderId: orderCreated.order.id,
          orderNumber: orderCreated.order.orderNumber,
          total: orderCreated.order.total.toString(),
          currency: orderCreated.order.currency,
          email: session?.user?.email || orderData.email || '',
          paymentMethod: orderData.paymentType
        })

        toast({
          title: "Paiement réussi !",
          description: `Commande ${orderCreated.order.orderNumber} confirmée`,
          variant: "default"
        })

        router.push(`/order-success?${successParams.toString()}`)

      } else {
        throw new Error('Paiement non confirmé par PayPal')
      }

    } catch (error) {
      console.error('❌ Erreur traitement retour PayPal:', error)
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.",
        variant: "destructive"
      })
      
      // Nettoyer et revenir au checkout
      localStorage.removeItem('paypal_checkout_data')
      localStorage.removeItem('paypal_pending_order_id')
      router.replace('/checkout')
    } finally {
      setIsProcessingPayPalReturn(false)
    }
  }

  // Écran de traitement du retour PayPal
  if (isProcessingPayPalReturn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Finalisation de votre commande</h2>
          <p className="mt-2 text-gray-600">Traitement du paiement PayPal en cours...</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>✅ Vérification du paiement</p>
            <p>📦 Création de la commande</p>
            <p>🗑️ Vidage du panier</p>
            <p>📊 Mise à jour de l'inventaire</p>
          </div>
          <p className="mt-4 text-xs text-gray-400">Veuillez patienter, cela ne prend que quelques secondes...</p>
        </div>
      </div>
    )
  }

  // Charger les données du panier
  useEffect(() => {
    if (!isMounted) return
    loadOrderData()
  }, [isMounted])

  // Charger les adresses utilisateur et préremplir les données si connecté
  useEffect(() => {
    if (session?.user?.id && !sessionInitialized) {
      // Préremplir immédiatement les données utilisateur
      setFormData(prev => ({
        ...prev,
        email: session.user.email || prev.email,
        firstName: session.user.firstName || prev.firstName,
        lastName: session.user.lastName || prev.lastName,
        phone: session.user.phone || prev.phone
      }))
      
      loadUserAddresses()
      setSessionInitialized(true)
    }
  }, [session, sessionInitialized])

  const loadOrderData = async () => {
    try {
      // Récupérer les données du panier depuis l'API (base de données)
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Données panier depuis API:', data)
        
        // Transformer les données pour le format attendu par le checkout
        const transformedData = {
          items: data.items || [],
          total: data.cart?.total || 0,
          currency: 'MGA' // Devise de base
        }
        
        setOrderData(transformedData)
        
        // Vérifier si l'utilisateur doit être connecté
        if (!session?.user && status !== 'loading') {
          setShowAuthRequired(true)
          return
        }
        
        // Préremplir les données utilisateur si connecté
        if (session?.user) {
          setFormData(prev => ({
            ...prev,
            email: session.user.email || '',
            firstName: session.user.firstName || '',
            lastName: session.user.lastName || '',
            phone: session.user.phone || ''
          }))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger votre panier",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserAddresses = async () => {
    try {
      const response = await fetch('/api/profile/addresses')
      if (response.ok) {
        const addresses = await response.json()
        setUserAddresses(addresses)
        
        // Sélectionner l'adresse par défaut
        const defaultAddress = addresses.find((addr: UserAddress) => addr.isDefault)
        if (defaultAddress) {
          setFormData(prev => ({
            ...prev,
            selectedBillingAddressId: defaultAddress.id,
            selectedShippingAddressId: defaultAddress.id
          }))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error)
    }
  }

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('✅ Paiement réussi:', paymentData)
    
    try {
      // Calculer le total côté client
      const calculatedTotal = (orderData.items || []).reduce((sum, item) => 
        sum + ((item.price || 0) * (item.quantity || 0)), 0
      )

      // Créer la commande en base de données
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderData.items,
          total: calculatedTotal || orderData.total,
          deliveryCost: deliveryCost,
          deliveryInfo: selectedDelivery,
          currency: targetCurrency || currency || orderData.currency || 'MGA',
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.shippingAddress,
            city: formData.shippingCity,
            postalCode: formData.shippingZipCode,
            country: formData.shippingCountry,
            phone: formData.phone
          },
          billingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.billingAddress,
            city: formData.billingCity,
            postalCode: formData.billingZipCode,
            country: formData.billingCountry,
            phone: formData.phone
          },
          email: session?.user?.email || formData.email,
          phone: formData.phone,
          firstName: session?.user?.firstName || formData.firstName,
          lastName: session?.user?.lastName || formData.lastName,
          paymentData: {
            method: paymentData.method,
            status: paymentData.status,
            transactionId: paymentData.transactionId,
            paypalOrderId: paymentData.paypalOrderId,
            details: paymentData
          },
          notes: formData.notes,
          
          // Taux de change au moment de la commande
          exchangeRates: exchangeRates,
          baseCurrency: currency, // MGA
          displayCurrency: targetCurrency || currency,
          
          // Informations de promotion
          promotion: appliedPromo ? {
            id: appliedPromo.id,
            code: appliedPromo.code,
            type: appliedPromo.type,
            value: appliedPromo.value,
            discountAmount: discountAmount
          } : null
        })
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderResult.error || 'Erreur lors de la création de la commande')
      }

      console.log('✅ Commande créée en base:', orderResult.order)

      // Vider le panier après création de commande
      try {
        await fetch('/api/cart/clear', { method: 'POST' })
        localStorage.removeItem('cart')
        localStorage.removeItem('pendingOrder')
        console.log('✅ Panier vidé avec succès')
        
        // Déclencher l'événement de mise à jour du panier
        window.dispatchEvent(new Event('cartUpdated'))
      } catch (error) {
        console.warn('⚠️ Erreur lors du vidage du panier:', error)
      }

      // Rediriger vers la page de succès avec les vraies données
      const successParams = new URLSearchParams({
        orderId: orderResult.order.id,
        orderNumber: orderResult.order.orderNumber,
        total: orderResult.order.total.toString(),
        currency: orderResult.order.currency,
        email: orderResult.order.email,
        paymentMethod: orderResult.order.paymentMethod
      })
      
      toast({
        title: "Commande confirmée !",
        description: `Commande ${orderResult.order.orderNumber} créée avec succès`,
      })
      
      router.push(`/order-success?${successParams.toString()}`)

    } catch (error) {
      console.error('❌ Erreur création commande:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la commande. Contactez le support.",
        variant: "destructive"
      })
    }
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Erreur de paiement",
      description: error,
      variant: "destructive"
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">Chargement de votre commande...</p>
          <p className="text-sm text-gray-500">Préparation de votre checkout sécurisé</p>
        </div>
      </div>
    )
  }

  // Écran d'authentification requis
  if (showAuthRequired) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="text-4xl text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Connexion requise</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Vous devez être connecté pour finaliser votre commande
          </p>
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => setAuthModalOpen(true)}
            >
              <User className="mr-2 h-5 w-5" />
              Se connecter
            </Button>
            <p className="text-sm text-gray-500">
              Pas encore de compte ? 
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="ml-1 text-blue-600 hover:text-blue-700 underline"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Votre panier est vide</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Découvrez nos produits et services pour commencer vos achats
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Découvrir nos produits
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Colonne gauche - Formulaires (2/3 de l'espace) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Informations client */}
        {session?.user ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Connecté en tant que {session.user.firstName || session.user.name || 'Utilisateur'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Informations de compte utilisées</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Email :</strong> {session.user.email}</p>
                  {session.user.firstName && <p><strong>Nom :</strong> {session.user.firstName} {session.user.lastName}</p>}
                  {session.user.phone && <p><strong>Téléphone :</strong> {session.user.phone}</p>}
                </div>
                <button 
                  onClick={() => signOut()}
                  className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
                >
                  Se déconnecter et saisir d'autres informations
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  Vous avez déjà un compte ? 
                  <button 
                    onClick={() => setAuthModalOpen(true)}
                    className="ml-1 underline hover:no-underline"
                  >
                    Connectez-vous
                  </button>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Adresse de facturation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Adresse de facturation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userAddresses.length > 0 && (
              <div>
                <Label>Adresses enregistrées</Label>
                <Select
                  value={formData.selectedBillingAddressId}
                  onValueChange={(value) => setFormData(prev => ({...prev, selectedBillingAddressId: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une adresse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nouvelle adresse</SelectItem>
                    {userAddresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.id}>
                        {addr.street}, {addr.city} {addr.zipCode}
                        {addr.isDefault && <Badge className="ml-2">Par défaut</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(!formData.selectedBillingAddressId || formData.selectedBillingAddressId === 'new') && (
              <>
                <div>
                  <Label htmlFor="billingAddress">Adresse *</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData(prev => ({...prev, billingAddress: e.target.value}))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingCity">Ville *</Label>
                    <Input
                      id="billingCity"
                      value={formData.billingCity}
                      onChange={(e) => setFormData(prev => ({...prev, billingCity: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingZipCode">Code postal *</Label>
                    <Input
                      id="billingZipCode"
                      value={formData.billingZipCode}
                      onChange={(e) => setFormData(prev => ({...prev, billingZipCode: e.target.value}))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="billingCountry">Pays *</Label>
                  <Select
                    value={formData.billingCountry}
                    onValueChange={(value) => setFormData(prev => ({...prev, billingCountry: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Madagascar">Madagascar</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Maurice">Maurice</SelectItem>
                      <SelectItem value="Réunion">Réunion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes de commande */}
        <Card>
          <CardHeader>
            <CardTitle>Notes de commande (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Instructions spéciales pour la livraison ou autres notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Adresse de livraison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsShipping"
                checked={sameAsbilling}
                onCheckedChange={(checked) => setSameAsBinding(checked as boolean)}
              />
              <Label htmlFor="sameAsShipping">
                Utiliser l'adresse de facturation pour la livraison
              </Label>
            </div>

            {!sameAsbilling && (
              <>
                {userAddresses.length > 0 && (
                  <div>
                    <Label>Adresses enregistrées</Label>
                    <Select
                      value={formData.selectedShippingAddressId}
                      onValueChange={(value) => setFormData(prev => ({...prev, selectedShippingAddressId: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une adresse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nouvelle adresse</SelectItem>
                        {userAddresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.street}, {addr.city} {addr.zipCode}
                            {addr.isDefault && <Badge className="ml-2">Par défaut</Badge>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {(!formData.selectedShippingAddressId || formData.selectedShippingAddressId === 'new') && (
                  <>
                    <div>
                      <Label htmlFor="shippingAddress">Adresse *</Label>
                      <Input
                        id="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData(prev => ({...prev, shippingAddress: e.target.value}))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingCity">Ville *</Label>
                        <Input
                          id="shippingCity"
                          value={formData.shippingCity}
                          onChange={(e) => setFormData(prev => ({...prev, shippingCity: e.target.value}))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingZipCode">Code postal</Label>
                        <Input
                          id="shippingZipCode"
                          value={formData.shippingZipCode}
                          onChange={(e) => setFormData(prev => ({...prev, shippingZipCode: e.target.value}))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingCountry">Pays</Label>
                      <Select
                        value={formData.shippingCountry}
                        onValueChange={(value) => setFormData(prev => ({...prev, shippingCountry: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Madagascar">Madagascar</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Maurice">Maurice</SelectItem>
                          <SelectItem value="Réunion">Réunion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Mode de livraison */}
        <DeliveryOptions
          selectedDeliveryId={selectedDelivery?.id || null}
          onDeliveryChange={handleDeliveryChange}
          shippingAddress={{
            city: formData.shippingCity || 'Antananarivo',
            country: formData.shippingCountry || 'Madagascar'
          }}
        />

        {/* Mode de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Mode de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector
              total={getTotalWithDelivery()}
              currency={orderData.currency || 'Ar'}
              orderData={{
                items: orderData.items || [],
                customerInfo: {
                  email: formData.email,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  phone: formData.phone
                },
                shippingAddress: (() => {
                  console.log('🔍 CHECKOUT DEBUG - Construction shippingAddress:', {
                    sameAsbilling,
                    selectedBillingAddressId: formData.selectedBillingAddressId,
                    selectedShippingAddressId: formData.selectedShippingAddressId
                  });
                  
                  // Si case cochée et adresse de facturation sélectionnée, utiliser celle-ci pour la livraison
                  if (sameAsbilling && formData.selectedBillingAddressId && formData.selectedBillingAddressId !== 'new') {
                    const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedBillingAddressId);
                    console.log('✅ CAS 1: Copie depuis adresse de facturation sélectionnée', selectedAddr);
                    if (selectedAddr) {
                      const result = {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: selectedAddr.street,
                        city: selectedAddr.city,
                        postalCode: selectedAddr.zipCode,
                        country: selectedAddr.country,
                        phone: selectedAddr.phoneNumber || formData.phone
                      };
                      console.log('📦 SHIPPING RESULT (cas 1):', result);
                      return result;
                    }
                  }
                  
                  // Si case cochée mais pas d'adresse de facturation sélectionnée, utiliser les champs manuels de facturation
                  if (sameAsbilling) {
                    console.log('⚠️  CAS 2: Copie depuis champs manuels de facturation');
                    const result = {
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      address: formData.billingAddress,
                      city: formData.billingCity,
                      postalCode: formData.billingZipCode,
                      country: formData.billingCountry,
                      phone: formData.phone
                    };
                    console.log('📦 SHIPPING RESULT (cas 2):', result);
                    return result;
                  }
                  
                  // Sinon, logique normale pour l'adresse de livraison
                  if (formData.selectedShippingAddressId && formData.selectedShippingAddressId !== 'new') {
                    const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedShippingAddressId);
                    return selectedAddr ? {
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      address: selectedAddr.street,
                      city: selectedAddr.city,
                      postalCode: selectedAddr.zipCode,
                      country: selectedAddr.country,
                      phone: selectedAddr.phoneNumber || formData.phone
                    } : null;
                  }
                  
                  // Adresse manuelle de livraison
                  return {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.shippingAddress,
                    city: formData.shippingCity,
                    postalCode: formData.shippingZipCode,
                    country: formData.shippingCountry,
                    phone: formData.phone
                  };
                })(),
                billingAddress: (() => {
                  // Logique normale pour l'adresse de facturation (indépendante de la case cochée)
                  if (formData.selectedBillingAddressId && formData.selectedBillingAddressId !== 'new') {
                    const selectedAddr = userAddresses.find(addr => addr.id === formData.selectedBillingAddressId);
                    return selectedAddr ? {
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      address: selectedAddr.street,
                      city: selectedAddr.city,
                      postalCode: selectedAddr.zipCode,
                      country: selectedAddr.country,
                      phone: selectedAddr.phoneNumber || formData.phone
                    } : null;
                  }
                  
                  // Adresse manuelle de facturation
                  return {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.billingAddress,
                    city: formData.billingCity,
                    postalCode: formData.billingZipCode,
                    country: formData.billingCountry,
                    phone: formData.phone
                  };
                })(),
                notes: formData.notes
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </CardContent>
        </Card>
      </div>

      {/* Colonne droite - Résumé et paiement */}
      <div className="space-y-6">
        {/* Code promo */}
        <PromoCodeInput
          subtotal={orderData?.total || 0}
          onPromoApplied={handlePromoApplied}
          onPromoRemoved={handlePromoRemoved}
          appliedPromo={appliedPromo}
          discountAmount={discountAmount}
        />

        {/* Résumé de commande */}
        <OrderSummary
          items={orderData?.items || []}
          appliedPromo={appliedPromo}
          discountAmount={discountAmount}
          shippingCost={deliveryCost}
          freeShipping={appliedPromo?.type === 'FREE_SHIPPING'}
        />

      </div>
    </div>
    
    {/* Modal d'authentification */}
    <AuthModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      defaultMode="login"
    />
    </>
  )
}