'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, ExternalLink, CreditCard, DollarSign, Smartphone, ArrowRight } from 'lucide-react'
import { getSecureBaseUrl, getPayPalReturnUrls } from '@/lib/utils/get-base-url'

interface PayPalRedirectProps {
  paymentType: 'paypal' | 'credit_card' | 'digital_wallet'
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PayPalRedirect({ paymentType, amount, currency, orderData, onSuccess, onError }: PayPalRedirectProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')

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

  const processPaymentRedirect = async () => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      console.log(`🚀 Création commande ${paymentType} pour redirection:`, {
        amount: getPayPalAmount(),
        currency: getPayPalCurrency(),
        type: paymentType
      })

      // Stocker les données de commande dans localStorage pour le retour
      const orderDataForStorage = {
        ...orderData,
        paymentType,
        originalAmount: amount,
        originalCurrency: currency,
        paypalAmount: getPayPalAmount(),
        paypalCurrency: getPayPalCurrency(),
        timestamp: Date.now()
      }

      localStorage.setItem('paypal_checkout_data', JSON.stringify(orderDataForStorage))
      localStorage.setItem('paypal_checkout_callbacks', JSON.stringify({
        successCallback: 'paypal_success',
        errorCallback: 'paypal_error'
      }))

      // Créer la commande PayPal avec URLs de retour sécurisées
      const baseUrl = getSecureBaseUrl()
      const returnUrl = `${baseUrl}/checkout?paypal_return=success&payment_type=${paymentType}`
      const cancelUrl = `${baseUrl}/checkout?paypal_return=cancel&payment_type=${paymentType}`

      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getPayPalAmount(),
          currency: getPayPalCurrency(),
          orderData: {
            ...orderDataForStorage,
            returnUrl,
            cancelUrl
          }
        }),
      })

      const data = await response.json()

      if (data.id) {
        console.log(`✅ Commande ${paymentType} créée pour redirection:`, data.id)
        
        // Stocker l'order ID pour le retour
        localStorage.setItem('paypal_pending_order_id', data.id)
        
        // Construire l'URL PayPal avec paramètres appropriés
        let paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`
        
        // Ajouter des paramètres spécifiques selon le type de paiement
        if (paymentType === 'credit_card') {
          paypalUrl += '&useraction=commit&fundingSource=card'
        } else if (paymentType === 'digital_wallet') {
          paypalUrl += '&useraction=commit&fundingSource=applepay,googlepay'
        } else {
          paypalUrl += '&useraction=commit'
        }

        console.log(`🌐 Redirection vers PayPal: ${paypalUrl}`)

        // Message de redirection
        setIsProcessing(false)
        
        // Redirection immédiate
        window.location.href = paypalUrl

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

  const color = getPaymentTypeColor()

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              {getPaymentTypeIcon()}
              <span>Paiement sécurisé via {getPaymentTypeName()}</span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
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
                🌐 <strong>Redirection PayPal</strong> - Vous serez redirigé vers PayPal.com pour finaliser votre paiement.
                {paymentType === 'digital_wallet' && (
                  <span className="block mt-1">📱 Apple Pay et Google Pay seront détectés automatiquement.</span>
                )}
              </p>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm text-gray-600 text-center">
                    Préparation de la redirection PayPal...
                  </span>
                  <p className="text-xs text-gray-500 text-center">
                    Vous allez être redirigé vers PayPal.com
                  </p>
                </div>
              </div>
            )}

            {!isProcessing && (
              <div className="space-y-3">
                <Button 
                  onClick={processPaymentRedirect}
                  className={`w-full bg-${color}-600 hover:bg-${color}-700`}
                  size="lg"
                >
                  {getPaymentTypeIcon()}
                  <ArrowRight className="h-4 w-4 ml-2" />
                  Continuer vers {getPaymentTypeName()}
                </Button>

                {paymentError && (
                  <Button 
                    onClick={() => {
                      setPaymentError('')
                      processPaymentRedirect()
                    }}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    🔄 Réessayer
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
                <p className="font-medium mb-1">🌐 Processus de Redirection :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Redirection vers PayPal.com</li>
                  <li>• Paiement sécurisé sur site officiel</li>
                  <li>• Retour automatique après paiement</li>
                  <li>• Création de commande automatique</li>
                  <li>• Vidage du panier et mise à jour stock</li>
                </ul>
              </div>

              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <p className="font-medium mb-1">💡 Avantages de la redirection :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Fonctionne sur TOUS les navigateurs</li>
                  <li>• Pas de bloqueur de popup</li>
                  <li>• Interface PayPal familière</li>
                  <li>• Maximum de sécurité</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Redirection sécurisée vers</span>
          <div className="font-semibold text-blue-600">PayPal.com</div>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}
