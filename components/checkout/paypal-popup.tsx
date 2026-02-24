'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, ExternalLink, CreditCard, DollarSign, Smartphone } from 'lucide-react'

interface PayPalPopupProps {
  paymentType: 'paypal' | 'credit_card' | 'digital_wallet'
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PayPalPopup({ paymentType, amount, currency, orderData, onSuccess, onError }: PayPalPopupProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [paypalOrderId, setPaypalOrderId] = useState<string>('')

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

  const createOrderAndOpenPopup = async () => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      console.log(`🚀 Création commande ${paymentType} pour popup:`, {
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
        console.log(`✅ Commande ${paymentType} créée pour popup:`, data.id)
        setPaypalOrderId(data.id)
        
        // Construire l'URL PayPal avec les bons paramètres selon le type
        let paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`
        
        // Ajouter des paramètres spécifiques selon le type de paiement
        if (paymentType === 'credit_card') {
          paypalUrl += '&useraction=commit&cmd=_express-checkout&fundingSource=card'
        } else if (paymentType === 'digital_wallet') {
          paypalUrl += '&useraction=commit&cmd=_express-checkout&fundingSource=applepay,googlepay'
        }

        console.log(`🌐 Ouverture popup PayPal: ${paypalUrl}`)

        // Ouvrir popup PayPal
        const popup = window.open(
          paypalUrl,
          'paypal_payment',
          'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
        )

        if (!popup) {
          throw new Error('Popup bloqué par le navigateur. Autorisez les popups pour ce site.')
        }

        // Surveiller la fermeture du popup
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            setIsProcessing(false)
            console.log('🔄 Popup fermé, vérification du statut de paiement...')
            
            // Vérifier si le paiement a été effectué
            setTimeout(() => {
              checkPaymentStatus(data.id)
            }, 1000)
          }
        }, 1000)

        // Timeout de sécurité
        setTimeout(() => {
          if (!popup.closed) {
            clearInterval(checkClosed)
            popup.close()
            setIsProcessing(false)
            setPaymentError('Timeout de paiement. Veuillez réessayer.')
          }
        }, 600000) // 10 minutes max

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

  const checkPaymentStatus = async (orderId: string) => {
    try {
      console.log(`🔍 Vérification statut paiement: ${orderId}`)
      
      // Essayer de capturer le paiement
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
        console.log(`✅ Paiement ${paymentType} capturé via popup:`, result.id)
        onSuccess({
          method: paymentType,
          status: 'completed',
          transactionId: result.id,
          paypalOrderId: orderId,
          message: `Paiement via ${getPaymentTypeName()} effectué avec succès`
        })
      } else if (result.error && result.error.includes('not approved')) {
        // Paiement annulé par l'utilisateur
        setPaymentError('Paiement annulé')
        console.log('💬 Paiement annulé par l\'utilisateur')
      } else {
        throw new Error(result.error || 'Paiement non confirmé')
      }
    } catch (error) {
      console.error(`❌ Erreur vérification paiement:`, error)
      setPaymentError('Impossible de vérifier le statut du paiement')
    }
  }

  const retryPayment = () => {
    setPaymentError('')
    setPaypalOrderId('')
    createOrderAndOpenPopup()
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
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>

            {currency === 'Ar' && (
              <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
                <p className={`text-sm text-${color}-800`}>
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {getPayPalAmount()}€ EUR
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🪟 <strong>Mode Popup PayPal</strong> - Une nouvelle fenêtre s'ouvrira pour le paiement sécurisé.
                {paymentType === 'digital_wallet' && (
                  <span className="block mt-1">📱 Apple Pay et Google Pay seront détectés automatiquement.</span>
                )}
              </p>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {paymentError}
                  {paymentError.includes('Popup bloqué') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                      💡 <strong>Solution :</strong> Autorisez les popups pour ce site dans votre navigateur
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm text-gray-600 text-center">
                    {paypalOrderId 
                      ? 'Paiement en cours dans la popup...'
                      : `Préparation ${getPaymentTypeName()}...`
                    }
                  </span>
                  {paypalOrderId && (
                    <p className="text-xs text-gray-500 text-center">
                      Terminez le paiement dans la fenêtre PayPal puis fermez-la
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isProcessing && (
              <div className="space-y-3">
                <Button 
                  onClick={createOrderAndOpenPopup}
                  className={`w-full bg-${color}-600 hover:bg-${color}-700`}
                  size="lg"
                >
                  {getPaymentTypeIcon()}
                  <ExternalLink className="h-4 w-4 ml-2" />
                  Payer via {getPaymentTypeName()} (Popup)
                </Button>

                {paymentError && (
                  <Button 
                    onClick={retryPayment}
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
                <p className="font-medium mb-1">🔒 Mode Popup Sécurisé :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Traitement direct sur PayPal.com</li>
                  <li>• Aucune donnée sensible sur notre site</li>
                  <li>• Compatible avec tous les navigateurs</li>
                  <li>• Contourne les problèmes de SDK</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Traitement sécurisé par</span>
          <div className="font-semibold text-blue-600">PayPal</div>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}
