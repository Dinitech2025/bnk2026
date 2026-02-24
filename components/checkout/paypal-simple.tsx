'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { useCurrency } from '@/lib/contexts/currency-context'

interface PayPalSimpleProps {
  amount: number
  currency: string
  orderData: any
  provider?: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PayPalSimple({
  amount,
  currency,
  orderData,
  provider,
  onSuccess,
  onError
}: PayPalSimpleProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const { exchangeRates } = useCurrency()

  // Convertir le montant selon la devise du système
  const getPayPalAmount = () => {
    if (currency === 'Ar' || currency === 'MGA') {
      // Utiliser le taux EUR du système au lieu du taux hardcodé
      const eurRate = exchangeRates['EUR']
      if (eurRate) {
        // eurRate est déjà le bon taux (ex: 0.000196)
        // 1 MGA * 0.000196 = montant en EUR
        return (amount * eurRate).toFixed(2)
      }
      // Fallback si pas de taux EUR (utilise le taux système par défaut)
      return (amount * 0.000196).toFixed(2) // 1 EUR ≈ 5102 MGA
    }
    return (amount / 100).toFixed(2)
  }

  const getPayPalCurrency = () => {
    if (currency === 'Ar' || currency === 'MGA') {
      return 'EUR'
    }
    return currency.toUpperCase()
  }

  const handlePayPalPayment = async () => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      // Validation du montant
      if (!amount || amount <= 0) {
        throw new Error('Montant invalide pour le paiement PayPal')
      }

      const convertedAmount = getPayPalAmount()
      if (!convertedAmount || parseFloat(convertedAmount) <= 0) {
        throw new Error('Montant converti invalide pour PayPal')
      }

      console.log('🚀 Création commande PayPal:', {
        originalAmount: amount,
        originalCurrency: currency,
        convertedAmount: convertedAmount,
        convertedCurrency: getPayPalCurrency(),
        systemExchangeRates: exchangeRates,
        eurRateUsed: exchangeRates['EUR'],
        provider: provider?.name || 'Default'
      })

      // Créer la commande
      const createResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getPayPalAmount(),
          currency: getPayPalCurrency(),
          orderData,
          providerId: provider?.id
        }),
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Erreur lors de la création de la commande')
      }

      console.log('✅ Commande PayPal créée:', createData.id)

      // Rediriger vers PayPal pour le paiement
      const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${createData.id}`
      
      // Ouvrir PayPal dans une nouvelle fenêtre
      const paypalWindow = window.open(
        approvalUrl,
        'paypal-payment',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!paypalWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre PayPal. Veuillez autoriser les popups.')
      }

      // Référence pour les tests
      (window as any).paypalTestWindow = paypalWindow

      // Polling pour vérifier l'état de la fenêtre et du paiement
      const checkPaymentStatus = setInterval(async () => {
        console.log('🔍 Vérification fenêtre PayPal...', { closed: paypalWindow.closed })
        
        // Vérifier si la fenêtre est fermée
        if (paypalWindow.closed) {
          clearInterval(checkPaymentStatus)
          console.log('🔄 Fenêtre PayPal fermée, vérification du paiement...')
          
          try {
            // Attendre un peu pour que PayPal traite le paiement
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Essayer de capturer le paiement
            const captureResponse = await fetch('/api/paypal/capture-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderID: createData.id,
                orderData
              }),
            })

            const captureData = await captureResponse.json()

            if (captureResponse.ok && captureData.status === 'COMPLETED') {
              console.log('✅ Paiement PayPal capturé:', captureData)
              onSuccess({
                method: 'paypal',
                status: 'completed',
                transactionId: captureData.captureId || captureData.id,
                paypalOrderId: createData.id,
                amount: captureData.amount,
                message: 'Paiement PayPal réussi'
              })
            } else {
              console.log('❌ Paiement PayPal annulé ou échoué:', captureData)
              onError('Paiement PayPal annulé ou échoué')
            }
          } catch (error) {
            console.error('❌ Erreur capture PayPal:', error)
            onError('Erreur lors de la capture du paiement PayPal')
          }
          
          setIsProcessing(false)
        }
      }, 1000)

      // Timeout de sécurité (5 minutes)
      const timeout = setTimeout(() => {
        clearInterval(checkPaymentStatus)
        if (paypalWindow && !paypalWindow.closed) {
          paypalWindow.close()
        }
        onError('Timeout du paiement PayPal')
        setIsProcessing(false)
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('❌ Erreur PayPal:', error)
      setPaymentError(error instanceof Error ? error.message : 'Erreur de paiement PayPal')
      onError('Erreur lors du paiement PayPal')
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <CreditCard className="h-4 w-4" />
              <span>Paiement sécurisé via PayPal</span>
              {provider && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {provider.name}
                </span>
              )}
            </div>

            {(currency === 'Ar' || currency === 'MGA' || !currency) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {getPayPalAmount()}€ EUR
                </p>
              </div>
            )}

            {paymentError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                onClick={handlePayPalPayment}
                disabled={isProcessing}
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Paiement en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payer avec PayPal ({getPayPalAmount()}€)
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    💡 Effectuez votre paiement dans la fenêtre PayPal qui s'est ouverte.
                    <br />
                    Cette page se mettra à jour automatiquement après le paiement.
                  </p>
                  <div className="mt-2 text-center">
                    <button 
                      onClick={() => {
                        console.log('🧪 Test: Simulation fermeture fenêtre PayPal')
                        // Simuler la fermeture pour test
                        if (window.paypalTestWindow) {
                          window.paypalTestWindow.close()
                        }
                      }}
                      className="text-xs text-blue-600 underline"
                    >
                      [Test] Simuler fermeture
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Paiement sécurisé • Protection acheteur • Chiffrement SSL
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Traitement sécurisé par</span>
          <div className="font-semibold text-[#0070ba]">PayPal</div>
        </div>
      </div>
    </div>
  )
}
