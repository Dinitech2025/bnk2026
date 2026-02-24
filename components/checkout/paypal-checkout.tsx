'use client'

import { useState, useEffect } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'

interface PayPalCheckoutProps {
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

interface PayPalButtonsWrapperProps extends PayPalCheckoutProps {}

function PayPalButtonsWrapper({ amount, currency, orderData, onSuccess, onError }: PayPalButtonsWrapperProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Vérifier que le SDK PayPal est chargé avec timeout
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 30 // 30 secondes maximum

    const checkSDK = () => {
      attempts++
      
      if (typeof window !== 'undefined' && window.paypal && window.paypal.Buttons) {
        setIsSDKReady(true)
        setLoadingTimeout(false)
      } else if (attempts >= maxAttempts) {
        // Timeout après 30 secondes
        setLoadingTimeout(true)
        setPaymentError('Impossible de charger PayPal. Vérifiez votre connexion internet.')
        onError('Timeout de chargement PayPal')
      } else {
        // Réessayer après un délai
        setTimeout(checkSDK, 1000)
      }
    }

    // Démarrer la vérification après un court délai
    const initialTimeout = setTimeout(checkSDK, 500)
    
    return () => clearTimeout(initialTimeout)
  }, [])

  // Convertir le montant selon la devise
  const getPayPalAmount = () => {
    // PayPal supporte différentes devises
    // Pour Madagascar, nous convertissons en EUR
    if (currency === 'Ar' || currency === 'MGA') {
      // Conversion approximative MGA vers EUR (1 EUR ≈ 5000 MGA)
      return (amount / 5000).toFixed(2)
    }
    return (amount / 100).toFixed(2) // Pour les autres devises déjà en centimes
  }

  const getPayPalCurrency = () => {
    // PayPal ne supporte pas MGA directement, on utilise EUR
    if (currency === 'Ar' || currency === 'MGA') {
      return 'EUR'
    }
    return currency.toUpperCase()
  }

  const createOrder = async () => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getPayPalAmount(),
          currency: getPayPalCurrency(),
          orderData
        }),
      })

      const data = await response.json()

      if (data.id) {
        return data.id
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la commande PayPal')
      }
    } catch (error) {
      console.error('Erreur création commande PayPal:', error)
      setPaymentError('Impossible de créer la commande PayPal')
      onError('Impossible de créer la commande PayPal')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const onApprove = async (data: any) => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: data.orderID,
          orderData
        }),
      })

      const result = await response.json()

      if (result.status === 'COMPLETED') {
        onSuccess({
          method: 'paypal',
          status: 'completed',
          transactionId: result.id,
          paypalOrderId: data.orderID,
          message: 'Paiement PayPal effectué avec succès'
        })
      } else {
        throw new Error('Paiement non confirmé')
      }
    } catch (error) {
      console.error('Erreur capture paiement PayPal:', error)
      setPaymentError('Erreur lors de la confirmation du paiement')
      onError('Erreur lors de la confirmation du paiement PayPal')
    } finally {
      setIsProcessing(false)
    }
  }

  const onErrorHandler = (err: any) => {
    console.error('Erreur PayPal:', err)
    setPaymentError('Erreur PayPal inattendue')
    onError('Erreur PayPal inattendue')
    setIsProcessing(false)
  }

  const onCancel = () => {
    setPaymentError('Paiement annulé par l\'utilisateur')
    setIsProcessing(false)
  }

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4" />
              <span>Paiement sécurisé PayPal</span>
            </div>

            {currency === 'Ar' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {getPayPalAmount()}€ EUR
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
                  <span className="text-sm text-gray-600">Traitement PayPal en cours...</span>
                </div>
              </div>
            )}

            <div className="min-h-[200px]">
              {loadingTimeout ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-red-600 mb-2">⚠️ Impossible de charger PayPal</p>
                    <p className="text-xs text-gray-500">
                      Vérifiez votre connexion internet ou réessayez
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
              ) : isSDKReady ? (
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'pay', // 'pay' au lieu de 'paypal' pour inclure cartes
                    height: 45,
                    tagline: false // Supprime le tagline pour plus d'espace
                  }}
                  fundingSource={undefined} // Permet toutes les sources de financement
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onErrorHandler}
                  onCancel={onCancel}
                  disabled={isProcessing}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Chargement de PayPal...</span>
                  </div>
                  <p className="text-xs text-gray-400">Cela peut prendre quelques secondes</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Protection des acheteurs PayPal incluse</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Powered by</span>
          <div className="font-semibold text-blue-600">PayPal</div>
        </div>
      </div>
    </div>
  )
}

export function PayPalCheckout(props: PayPalCheckoutProps) {
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          ⚠️ PayPal non configuré. Veuillez configurer NEXT_PUBLIC_PAYPAL_CLIENT_ID dans les variables d'environnement.
        </p>
      </div>
    )
  }

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: props.currency === 'Ar' ? 'EUR' : props.currency.toUpperCase(),
    intent: 'capture' as const,
    components: 'buttons', // Seulement buttons pour PayPal pur
    'enable-funding': 'venmo,paylater', // Pas de cartes pour ce composant
    'disable-funding': 'card', // Désactiver cartes pour PayPal pur
    // Options pour améliorer le chargement - EUR zone
    'buyer-country': 'FR', // France pour EUR
    locale: 'fr_FR',
    // Optimisations de performance
    'data-sdk-integration-source': 'button-factory',
    'data-namespace': 'paypal_sdk_pure'
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <PayPalButtonsWrapper {...props} />
    </PayPalScriptProvider>
  )
} 