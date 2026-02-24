'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, ExternalLink, CreditCard, DollarSign, Smartphone, CheckCircle } from 'lucide-react'

interface PayPalWindowProps {
  paymentType: 'paypal' | 'credit_card' | 'digital_wallet'
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PayPalWindow({ paymentType, amount, currency, orderData, onSuccess, onError }: PayPalWindowProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [paypalOrderId, setPaypalOrderId] = useState<string>('')
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null)
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const getPaymentTypeName = () => {
    switch (paymentType) {
      case 'paypal': return 'PayPal'
      case 'credit_card': return 'Carte bancaire'
      case 'digital_wallet': return 'Portefeuille digital'
      default: return 'Paiement'
    }
  }

  const getPaymentTypeIcon = () => {
    switch (paymentType) {
      case 'paypal': return <DollarSign className="h-4 w-4" />
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'digital_wallet': return <Smartphone className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getPaymentTypeColor = () => {
    switch (paymentType) {
      case 'paypal': return 'yellow'
      case 'credit_card': return 'blue'
      case 'digital_wallet': return 'purple'
      default: return 'gray'
    }
  }

  // Convertir le montant selon la devise
  const getPayPalAmount = () => {
    if (currency === 'Ar' || currency === 'MGA') {
      return (amount / 5000).toFixed(2) // MGA to EUR
    }
    return (amount / 100).toFixed(2)
  }

  const getPayPalCurrency = () => {
    if (currency === 'Ar' || currency === 'MGA') {
      return 'EUR'
    }
    return currency.toUpperCase()
  }

  const createOrderAndOpenWindow = async () => {
    setIsProcessing(true)
    setPaymentError('')
    setAwaitingPayment(false)

    try {
      console.log(`🚀 Création commande ${paymentType} pour fenêtre popup:`, {
        amount: getPayPalAmount(),
        currency: getPayPalCurrency(),
        type: paymentType
      })

      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getPayPalAmount(),
          currency: getPayPalCurrency(),
          orderData: {
            ...orderData,
            paymentType
          }
        }),
      })

      const data = await response.json()

      if (data.id) {
        console.log(`✅ Commande ${paymentType} créée pour fenêtre:`, data.id)
        setPaypalOrderId(data.id)
        
        // Construire l'URL PayPal avec paramètres appropriés
        let paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}&useraction=commit`
        
        // Ajouter des paramètres spécifiques selon le type de paiement
        if (paymentType === 'credit_card') {
          paypalUrl += '&fundingSource=card'
        } else if (paymentType === 'digital_wallet') {
          paypalUrl += '&fundingSource=applepay,googlepay'
        }

        console.log(`🪟 Ouverture fenêtre PayPal: ${paypalUrl}`)

        // Ouvrir fenêtre popup centrée
        const screenWidth = window.screen.width
        const screenHeight = window.screen.height
        const windowWidth = 600
        const windowHeight = 700
        const left = (screenWidth - windowWidth) / 2
        const top = (screenHeight - windowHeight) / 2

        const popup = window.open(
          paypalUrl,
          'paypal_payment_window',
          `width=${windowWidth},height=${windowHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no`
        )

        if (!popup) {
          throw new Error('Fenêtre bloquée par le navigateur. Autorisez les popups pour ce site.')
        }

        setPaymentWindow(popup)
        setAwaitingPayment(true)
        setIsProcessing(false)

        // Démarrer la surveillance de la fenêtre
        startWindowMonitoring(popup, data.id)

      } else {
        throw new Error(data.error || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error(`❌ Erreur création commande ${paymentType}:`, error)
      setPaymentError(`Impossible de traiter le paiement via ${getPaymentTypeName()}: ${error.message}`)
      onError(`Impossible de traiter le paiement via ${getPaymentTypeName()}`)
      setIsProcessing(false)
    }
  }

  const startWindowMonitoring = (popup: Window, orderId: string) => {
    console.log('🔄 Démarrage surveillance fenêtre PayPal...')

    // Vérifier toutes les 2 secondes si la fenêtre est fermée ou si le paiement est terminé
    const checkInterval = setInterval(async () => {
      try {
        // Vérifier si la fenêtre est fermée
        if (popup.closed) {
          console.log('🪟 Fenêtre PayPal fermée, vérification du paiement...')
          clearInterval(checkInterval)
          await checkPaymentCompletion(orderId)
          return
        }

        // Essayer de détecter la fin du paiement via l'URL de la fenêtre
        try {
          const currentUrl = popup.location.href
          if (currentUrl.includes('return_to_merchant') || currentUrl.includes('onboardingcomplete') || currentUrl.includes('completed')) {
            console.log('✅ URL de retour détectée, fermeture automatique...')
            popup.close()
            clearInterval(checkInterval)
            await checkPaymentCompletion(orderId)
            return
          }
        } catch (e) {
          // Cross-origin, on ne peut pas accéder à l'URL - c'est normal
        }

      } catch (error) {
        console.error('Erreur surveillance fenêtre:', error)
      }
    }, 2000)

    checkIntervalRef.current = checkInterval

    // Timeout de sécurité (10 minutes)
    setTimeout(() => {
      if (!popup.closed) {
        console.log('⏰ Timeout fenêtre PayPal, fermeture forcée')
        popup.close()
        clearInterval(checkInterval)
        setAwaitingPayment(false)
        setPaymentError('Timeout de paiement. Veuillez réessayer.')
      }
    }, 600000) // 10 minutes
  }

  const checkPaymentCompletion = async (orderId: string) => {
    try {
      setAwaitingPayment(false)
      setIsProcessing(true)
      
      console.log(`🔍 Vérification finale du paiement: ${orderId}`)
      
      // Attendre un peu pour que PayPal traite complètement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: orderId,
          orderData: {
            ...orderData,
            paymentType
          }
        }),
      })

      const result = await response.json()

      if (result.status === 'COMPLETED') {
        console.log(`✅ Paiement ${paymentType} capturé avec succès:`, result.id)
        
        // Traiter la commande complète
        await processOrderCompletion(result)
        
      } else if (result.error && result.error.includes('not approved')) {
        console.log('💬 Paiement annulé par l\'utilisateur')
        setPaymentError('Paiement annulé')
      } else {
        throw new Error(result.error || 'Paiement non confirmé')
      }
    } catch (error) {
      console.error(`❌ Erreur vérification paiement:`, error)
      setPaymentError('Erreur lors de la vérification du paiement')
    } finally {
      setIsProcessing(false)
    }
  }

  const processOrderCompletion = async (paymentResult: any) => {
    try {
      console.log('🎯 Traitement complet de la commande...')
      
      // 1. Créer la commande en base de données
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          paymentData: {
            method: paymentType,
            status: 'completed',
            transactionId: paymentResult.id,
            paypalOrderId: paypalOrderId,
            amount: getPayPalAmount(),
            currency: getPayPalCurrency()
          }
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Erreur lors de la création de la commande')
      }

      const orderCreated = await orderResponse.json()
      console.log('✅ Commande créée en base:', orderCreated.id)

      // 2. Vider le panier
      const cartResponse = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (cartResponse.ok) {
        console.log('✅ Panier vidé avec succès')
      }

      // 3. Décrémenter l'inventaire des produits
      for (const item of orderData.items) {
        try {
          const inventoryResponse = await fetch('/api/inventory/decrement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: item.productId || item.id,
              quantity: item.quantity
            })
          })

          if (inventoryResponse.ok) {
            console.log(`✅ Inventaire décrémenté pour produit ${item.productId || item.id}: -${item.quantity}`)
          } else {
            console.warn(`⚠️ Échec décrémentation inventaire pour ${item.productId || item.id}`)
          }
        } catch (error) {
          console.error(`❌ Erreur décrémentation inventaire:`, error)
        }
      }

      // 4. Succès final
      onSuccess({
        method: paymentType,
        status: 'completed',
        transactionId: paymentResult.id,
        paypalOrderId: paypalOrderId,
        orderId: orderCreated.id,
        message: `Commande confirmée ! Paiement via ${getPaymentTypeName()} effectué avec succès.`,
        orderData: orderCreated
      })

    } catch (error) {
      console.error('❌ Erreur traitement commande complète:', error)
      setPaymentError('Paiement réussi mais erreur de traitement. Contactez le support.')
    }
  }

  const cancelPayment = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close()
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }
    setAwaitingPayment(false)
    setPaypalOrderId('')
    setPaymentError('')
    setPaymentWindow(null)
  }

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
    }
  }, [paymentWindow])

  const color = getPaymentTypeColor()

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              {getPaymentTypeIcon()}
              <span>Paiement sécurisé via {getPaymentTypeName()}</span>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>

            {currency === 'Ar' && (
              <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                <p className={`text-sm text-${color}-800`}>
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {getPayPalAmount()}€ EUR
                </p>
              </div>
            )}

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                🪟 <strong>Mode Fenêtre PayPal</strong> - Une fenêtre popup s'ouvrira et se fermera automatiquement après paiement.
                {paymentType === 'digital_wallet' && (
                  <span className="block mt-1">📱 Apple Pay et Google Pay seront détectés automatiquement.</span>
                )}
              </p>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {paymentError}
                  {paymentError.includes('Fenêtre bloquée') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                      💡 <strong>Solution :</strong> Autorisez les popups pour ce site dans votre navigateur
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {awaitingPayment && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium text-blue-800">Paiement en cours dans la fenêtre PayPal</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Terminez votre paiement dans la fenêtre PayPal. Elle se fermera automatiquement.
                </p>
                <Button 
                  onClick={cancelPayment}
                  size="sm"
                  variant="outline"
                >
                  Annuler le paiement
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm text-gray-600 text-center">
                    {awaitingPayment 
                      ? 'Finalisation de la commande...'
                      : `Préparation ${getPaymentTypeName()}...`
                    }
                  </span>
                  {awaitingPayment && (
                    <p className="text-xs text-gray-500 text-center">
                      Création commande • Vidage panier • Mise à jour inventaire
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isProcessing && !awaitingPayment && (
              <div className="space-y-3">
                <Button 
                  onClick={createOrderAndOpenWindow}
                  className={`w-full bg-${color}-600 hover:bg-${color}-700`}
                  size="lg"
                >
                  {getPaymentTypeIcon()}
                  <ExternalLink className="h-4 w-4 ml-2" />
                  Payer via {getPaymentTypeName()} (Fenêtre)
                </Button>

                {paymentError && (
                  <Button 
                    onClick={() => {
                      setPaymentError('')
                      createOrderAndOpenWindow()
                    }}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    🔄 Réessayer le paiement
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>Paiement sécurisé • Chiffrement SSL • Protection acheteur</span>
              </div>
              
              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                <p className="font-medium mb-1">🪟 Processus Complet :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Fenêtre PayPal centrée (600x700px)</li>
                  <li>• Fermeture automatique après paiement</li>
                  <li>• Création de commande en base</li>
                  <li>• Vidage automatique du panier</li>
                  <li>• Décrémentation de l'inventaire</li>
                  <li>• Redirection vers confirmation</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Traitement complet par</span>
          <div className="font-semibold text-blue-600">PayPal + BoutikNaka</div>
          <CheckCircle className="h-3 w-3 text-green-500" />
        </div>
      </div>
    </div>
  )
}
