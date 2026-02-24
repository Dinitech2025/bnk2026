'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalLink, Shield } from 'lucide-react'

interface PayPalFallbackProps {
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PayPalFallback({ amount, currency, orderData, onSuccess, onError }: PayPalFallbackProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayPalRedirect = async () => {
    setIsProcessing(true)
    
    try {
      // Créer la commande via notre API
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currency === 'Ar' || currency === 'MGA' 
            ? (amount / 5000).toFixed(2) 
            : (amount / 100).toFixed(2),
          currency: currency === 'Ar' || currency === 'MGA' ? 'EUR' : currency,
          orderData
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la commande')
      }

      const data = await response.json()
      
      // Trouver l'URL d'approbation
      const approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`
      
      // Rediriger vers PayPal
      window.open(approveUrl, '_blank', 'width=800,height=600')
      
      // Simuler le succès pour la démo (en production, vous attendriez le callback)
      setTimeout(() => {
        onSuccess({
          method: 'paypal',
          status: 'completed',
          orderId: data.id,
          message: 'Redirection vers PayPal effectuée'
        })
        setIsProcessing(false)
      }, 2000)

    } catch (error) {
      console.error('Erreur PayPal Fallback:', error)
      onError('Erreur lors de la redirection vers PayPal')
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4" />
              <span>Paiement PayPal sécurisé (Mode alternatif)</span>
            </div>

            {currency === 'Ar' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {(amount / 5000).toFixed(2)}€ EUR
                </p>
              </div>
            )}

            <Alert>
              <AlertDescription>
                ℹ️ Vous serez redirigé vers PayPal dans un nouvel onglet pour finaliser votre paiement en toute sécurité.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handlePayPalRedirect}
              disabled={isProcessing}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              size="lg"
            >
              {isProcessing ? (
                'Redirection...'
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Payer avec PayPal</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              )}
            </Button>

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
