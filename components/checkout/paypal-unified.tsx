'use client'

import { useState, useEffect } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, CreditCard, DollarSign, Smartphone } from 'lucide-react'

interface PayPalUnifiedProps {
  paymentType: 'paypal' | 'credit_card' | 'digital_wallet'
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

interface PayPalButtonsWrapperProps extends PayPalUnifiedProps {}

function PayPalButtonsWrapper({ paymentType, amount, currency, orderData, onSuccess, onError }: PayPalButtonsWrapperProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Vérifier que le SDK PayPal est chargé avec timeout
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 20 // Réduit à 20 secondes pour être plus rapide

    const checkSDK = () => {
      attempts++
      
      if (typeof window !== 'undefined' && window.paypal && window.paypal.Buttons) {
        console.log(`✅ SDK PayPal chargé pour ${paymentType} après ${attempts} tentatives`)
        setIsSDKReady(true)
        setLoadingTimeout(false)
      } else if (attempts >= maxAttempts) {
        console.error(`❌ Timeout SDK PayPal pour ${paymentType} après ${attempts} tentatives`)
        setLoadingTimeout(true)
        setPaymentError(`Impossible de charger ${getPaymentTypeName()}. Vérifiez votre connexion.`)
        onError(`Timeout de chargement ${paymentType}`)
      } else {
        // Réessayer plus rapidement
        setTimeout(checkSDK, 500) // 500ms au lieu de 1s
      }
    }

    // Démarrer immédiatement
    checkSDK()
    
    return () => {
      // Cleanup si nécessaire
    }
  }, [paymentType, onError])

  const getPaymentTypeName = () => {
    switch (paymentType) {
      case 'paypal': return 'PayPal'
      case 'credit_card': return 'le système de cartes'
      case 'digital_wallet': return 'les portefeuilles digitaux'
      default: return 'le système de paiement'
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
      case 'paypal': return 'blue'
      case 'credit_card': return 'green'
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

  const createOrder = async () => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      console.log(`🚀 Création commande ${paymentType}:`, {
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
            paymentType // Ajouter le type pour tracking
          }
        }),
      })

      const data = await response.json()

      if (data.id) {
        console.log(`✅ Commande ${paymentType} créée:`, data.id)
        return data.id
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error(`❌ Erreur création commande ${paymentType}:`, error)
      setPaymentError(`Impossible de traiter le paiement via ${getPaymentTypeName()}`)
      onError(`Impossible de traiter le paiement via ${getPaymentTypeName()}`)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const onApprove = async (data: any) => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      console.log(`🎯 Capture paiement ${paymentType}:`, data.orderID)

      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: data.orderID,
          orderData: {
            ...orderData,
            paymentType
          }
        }),
      })

      const result = await response.json()

      if (result.status === 'COMPLETED') {
        console.log(`✅ Paiement ${paymentType} capturé:`, result.id)
        onSuccess({
          method: paymentType,
          status: 'completed',
          transactionId: result.id,
          paypalOrderId: data.orderID,
          message: `Paiement via ${getPaymentTypeName()} effectué avec succès`
        })
      } else {
        throw new Error(`Paiement via ${getPaymentTypeName()} non confirmé`)
      }
    } catch (error) {
      console.error(`❌ Erreur capture ${paymentType}:`, error)
      setPaymentError('Erreur lors de la confirmation du paiement')
      onError(`Erreur lors de la confirmation du paiement via ${getPaymentTypeName()}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const onErrorHandler = (err: any) => {
    console.error(`❌ Erreur PayPal ${paymentType}:`, err)
    setPaymentError(`Erreur de traitement ${getPaymentTypeName()}`)
    onError(`Erreur de traitement ${getPaymentTypeName()}`)
    setIsProcessing(false)
  }

  const onCancel = () => {
    setPaymentError(`Paiement via ${getPaymentTypeName()} annulé`)
    setIsProcessing(false)
  }

  const renderPaymentButtons = () => {
    if (!isSDKReady) return null

    const baseStyle = {
      layout: 'horizontal' as const,
      shape: 'rect' as const,
      label: 'pay' as const,
      height: 45,
      tagline: false
    }

    switch (paymentType) {
      case 'paypal':
        return (
          <PayPalButtons
            style={{
              ...baseStyle,
              color: 'gold'
            }}
            fundingSource={'paypal' as any}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onErrorHandler}
            onCancel={onCancel}
            disabled={isProcessing}
          />
        )

      case 'credit_card':
        return (
          <PayPalButtons
            style={{
              ...baseStyle,
              color: 'blue'
            }}
            fundingSource={'card' as any}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onErrorHandler}
            onCancel={onCancel}
            disabled={isProcessing}
          />
        )

      case 'digital_wallet':
        return (
          <div className="space-y-3">
            <PayPalButtons
              style={{
                ...baseStyle,
                color: 'black'
              }}
              fundingSource={'applepay' as any}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onErrorHandler}
              onCancel={onCancel}
              disabled={isProcessing}
            />
            <PayPalButtons
              style={{
                ...baseStyle,
                color: 'white'
              }}
              fundingSource={'googlepay' as any}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onErrorHandler}
              onCancel={onCancel}
              disabled={isProcessing}
            />
          </div>
        )

      default:
        return null
    }
  }

  const color = getPaymentTypeColor()

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              {getPaymentTypeIcon()}
              <span>Paiement sécurisé via {getPaymentTypeName()}</span>
            </div>

            {currency === 'Ar' && (
              <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                <p className={`text-sm text-${color}-800`}>
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {getPayPalAmount()}€ EUR
                </p>
              </div>
            )}

            {paymentType === 'digital_wallet' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  📱 Utilisez Touch ID, Face ID ou votre empreinte pour un paiement rapide et sécurisé.
                </p>
              </div>
            )}

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">
                    Traitement {getPaymentTypeName()} en cours...
                  </span>
                </div>
              </div>
            )}

            <div className="min-h-[120px]">
              {loadingTimeout ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-red-600 mb-2">
                      ⚠️ Impossible de charger {getPaymentTypeName()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Problème de connexion ou de configuration
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLoadingTimeout(false)
                      setPaymentError('')
                      window.location.reload()
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Réessayer
                  </button>
                </div>
              ) : !isSDKReady ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">
                      Chargement {getPaymentTypeName()}...
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Initialisation du paiement sécurisé</p>
                </div>
              ) : (
                renderPaymentButtons()
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Paiement sécurisé • Chiffrement SSL • Protection acheteur</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Traitement sécurisé par</span>
          <div className="font-semibold text-blue-600">PayPal</div>
        </div>
      </div>
    </div>
  )
}

export function PayPalUnified(props: PayPalUnifiedProps) {
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          ⚠️ PayPal non configuré. Veuillez configurer NEXT_PUBLIC_PAYPAL_CLIENT_ID.
        </p>
      </div>
    )
  }

  // Configuration unifiée pour tous les types de paiement
  const unifiedPayPalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: props.currency === 'Ar' ? 'EUR' : props.currency.toUpperCase(),
    intent: 'capture' as const,
    // TOUS les composants nécessaires dans UNE seule configuration
    components: 'buttons,hosted-fields,applepay,googlepay',
    // TOUS les funding sources activés
    'enable-funding': 'card,applepay,googlepay,venmo,paylater',
    // Pas de désactivation globale - on filtre par fundingSource
    'disable-funding': '',
    // Configuration européenne
    'buyer-country': 'FR',
    locale: 'fr_FR',
    // Optimisations
    'data-sdk-integration-source': 'button-factory',
    'data-namespace': 'paypal_sdk_unified', // Namespace unique
    // Réduire le délai de chargement
    'data-client-token': undefined
  }

  console.log(`🚀 Initialisation PayPal unifié pour ${props.paymentType}`)

  return (
    <PayPalScriptProvider options={unifiedPayPalOptions}>
      <PayPalButtonsWrapper {...props} />
    </PayPalScriptProvider>
  )
}
