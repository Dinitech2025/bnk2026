'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, ExternalLink, CreditCard, DollarSign, Smartphone, RefreshCw } from 'lucide-react'

interface PayPalNewTabProps {
  paymentType: 'paypal' | 'credit_card' | 'digital_wallet'
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PayPalNewTab({ paymentType, amount, currency, orderData, onSuccess, onError }: PayPalNewTabProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [paypalOrderId, setPaypalOrderId] = useState<string>('')
  const [awaitingReturn, setAwaitingReturn] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)

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

  const createOrderAndOpenTab = async () => {
    setIsProcessing(true)
    setPaymentError('')
    setAwaitingReturn(false)

    try {
      console.log(`🚀 Création commande ${paymentType} pour nouvel onglet:`, {
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
            paymentType,
            returnUrl: `${window.location.origin}/checkout?paypal_return=${paymentType}`,
            cancelUrl: `${window.location.origin}/checkout?paypal_cancel=true`
          }
        }),
      })

      const data = await response.json()

      if (data.id) {
        console.log(`✅ Commande ${paymentType} créée pour nouvel onglet:`, data.id)
        setPaypalOrderId(data.id)
        
        // Stocker l'order ID dans le localStorage pour le récupérer au retour
        localStorage.setItem('paypal_pending_order', JSON.stringify({
          orderId: data.id,
          paymentType,
          orderData,
          timestamp: Date.now()
        }))

        // Construire l'URL PayPal avec return/cancel URLs
        let paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`
        
        // Ajouter des paramètres spécifiques selon le type de paiement
        if (paymentType === 'credit_card') {
          paypalUrl += '&useraction=commit&fundingSource=card'
        } else if (paymentType === 'digital_wallet') {
          paypalUrl += '&useraction=commit&fundingSource=applepay,googlepay'
        }

        console.log(`🌐 Ouverture nouvel onglet PayPal: ${paypalUrl}`)

        // Ouvrir dans un nouvel onglet
        const newTab = window.open(paypalUrl, '_blank')

        if (!newTab) {
          throw new Error('Impossible d\'ouvrir un nouvel onglet. Vérifiez les paramètres de votre navigateur.')
        }

        setAwaitingReturn(true)
        setIsProcessing(false)

        // Démarrer la surveillance du retour
        startReturnMonitoring()

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

  const startReturnMonitoring = () => {
    // Surveiller les changements de focus pour détecter le retour
    const handleFocus = () => {
      console.log('🔄 Retour détecté sur l\'onglet principal')
      checkPendingPayment()
    }

    window.addEventListener('focus', handleFocus)

    // Nettoyer après 10 minutes
    setTimeout(() => {
      window.removeEventListener('focus', handleFocus)
    }, 600000)
  }

  const checkPendingPayment = async () => {
    const pendingOrder = localStorage.getItem('paypal_pending_order')
    if (!pendingOrder) return

    try {
      const orderInfo = JSON.parse(pendingOrder)
      
      // Vérifier que ce n'est pas trop ancien (10 minutes max)
      if (Date.now() - orderInfo.timestamp > 600000) {
        localStorage.removeItem('paypal_pending_order')
        return
      }

      setCheckingPayment(true)
      console.log(`🔍 Vérification statut paiement: ${orderInfo.orderId}`)
      
      // Essayer de capturer le paiement
      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: orderInfo.orderId,
          orderData: orderInfo.orderData
        }),
      })

      const result = await response.json()

      if (result.status === 'COMPLETED') {
        console.log(`✅ Paiement ${paymentType} capturé via nouvel onglet:`, result.id)
        localStorage.removeItem('paypal_pending_order')
        setAwaitingReturn(false)
        setCheckingPayment(false)
        onSuccess({
          method: paymentType,
          status: 'completed',
          transactionId: result.id,
          paypalOrderId: orderInfo.orderId,
          message: `Paiement via ${getPaymentTypeName()} effectué avec succès`
        })
      } else if (result.error && result.error.includes('not approved')) {
        // Paiement annulé par l'utilisateur
        console.log('💬 Paiement annulé par l\'utilisateur')
        localStorage.removeItem('paypal_pending_order')
        setAwaitingReturn(false)
        setCheckingPayment(false)
        setPaymentError('Paiement annulé')
      } else {
        // Paiement encore en attente, réessayer plus tard
        console.log('⏳ Paiement encore en attente...')
        setCheckingPayment(false)
      }
    } catch (error) {
      console.error(`❌ Erreur vérification paiement:`, error)
      setCheckingPayment(false)
      setPaymentError('Impossible de vérifier le statut du paiement')
    }
  }

  const manualCheck = () => {
    checkPendingPayment()
  }

  const cancelPayment = () => {
    localStorage.removeItem('paypal_pending_order')
    setAwaitingReturn(false)
    setPaypalOrderId('')
    setPaymentError('')
  }

  // Vérifier automatiquement s'il y a un paiement en attente au chargement
  useEffect(() => {
    checkPendingPayment()
  }, [])

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
                🗂️ <strong>Mode Nouvel Onglet</strong> - PayPal s'ouvrira dans un nouvel onglet pour un paiement sécurisé.
                {paymentType === 'digital_wallet' && (
                  <span className="block mt-1">📱 Apple Pay et Google Pay seront détectés automatiquement.</span>
                )}
              </p>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {paymentError}
                  {paymentError.includes('nouvel onglet') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                      💡 <strong>Solution :</strong> Autorisez les popups/nouveaux onglets pour ce site
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {awaitingReturn && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium text-blue-800">En attente du retour PayPal</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Terminez votre paiement dans l'onglet PayPal, puis revenez ici.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={manualCheck}
                    size="sm"
                    disabled={checkingPayment}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {checkingPayment ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Vérifier maintenant
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={cancelPayment}
                    size="sm"
                    variant="outline"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm text-gray-600 text-center">
                    Préparation {getPaymentTypeName()}...
                  </span>
                </div>
              </div>
            )}

            {!isProcessing && !awaitingReturn && (
              <div className="space-y-3">
                <Button 
                  onClick={createOrderAndOpenTab}
                  className={`w-full bg-${color}-600 hover:bg-${color}-700`}
                  size="lg"
                >
                  {getPaymentTypeIcon()}
                  <ExternalLink className="h-4 w-4 ml-2" />
                  Payer via {getPaymentTypeName()} (Nouvel onglet)
                </Button>

                {paymentError && (
                  <Button 
                    onClick={() => {
                      setPaymentError('')
                      createOrderAndOpenTab()
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
                <p className="font-medium mb-1">🗂️ Mode Nouvel Onglet :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Traitement direct sur PayPal.com</li>
                  <li>• Retour automatique détecté</li>
                  <li>• Compatible avec tous les navigateurs</li>
                  <li>• Aucun bloqueur de popup</li>
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
