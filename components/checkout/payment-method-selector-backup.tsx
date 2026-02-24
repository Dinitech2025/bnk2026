'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone, DollarSign, Truck } from 'lucide-react'
import { PayPalCheckout } from './paypal-checkout'
import { PayPalFallback } from './paypal-fallback'
import { CreditCardPayPal } from './credit-card-paypal'
import { DigitalWalletsPayPal } from './digital-wallets-paypal'
import { PayPalUnified } from './paypal-unified'

interface PaymentMethodSelectorProps {
  total: number
  currency: string
  orderData: any
  onPaymentSuccess: (paymentData: any) => void
  onPaymentError: (error: string) => void
}

export function PaymentMethodSelector({
  total,
  currency,
  orderData,
  onPaymentSuccess,
  onPaymentError
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPayPalButtons, setShowPayPalButtons] = useState(false)
  const [usePayPalFallback, setUsePayPalFallback] = useState(false)
  const [showCreditCardForm, setShowCreditCardForm] = useState(false)
  const [showDigitalWallets, setShowDigitalWallets] = useState(false)

  const paymentMethods = [
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Paiement via votre compte PayPal',
      icon: <DollarSign className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'credit_card',
      name: 'Carte bancaire',
      description: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'digital_wallet',
      name: 'Portefeuille digital',
      description: 'Apple Pay, Google Pay',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'MVola, Orange Money',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'cash_on_delivery',
      name: 'Paiement à la livraison',
      description: 'Payez en espèces ou carte lors de la livraison',
      icon: <Truck className="h-5 w-5" />,
      enabled: true
    }
  ]

  const handleTraditionalPayment = async (method: string) => {
    setIsProcessing(true)
    try {
      // Simuler le traitement pour les méthodes traditionnelles
      // Dans un vrai cas, vous appelleriez votre API backend
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onPaymentSuccess({
        method,
        status: 'pending',
        message: 'Commande créée avec succès. Instructions de paiement envoyées par email.'
      })
    } catch (error) {
      onPaymentError('Erreur lors du traitement de la commande')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderPaymentForm = () => {
    // Ne rendre le composant PayPal que si explicitement sélectionné
    switch (selectedMethod) {
      case 'paypal':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💳 Payez avec PayPal ou votre carte bancaire (Visa, Mastercard, Amex) via PayPal sécurisé.
              </p>
            </div>
            
            {!showPayPalButtons ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowPayPalButtons(true)}
                  className="w-full"
                  size="lg"
                >
                  Activer PayPal
                </Button>
                <Button 
                  onClick={() => setUsePayPalFallback(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  PayPal (Mode alternatif)
                </Button>
              </div>
            ) : usePayPalFallback ? (
              <PayPalFallback
                amount={total}
                currency={currency}
                orderData={orderData}
                onSuccess={onPaymentSuccess}
                onError={(error) => {
                  // En cas d'erreur, proposer l'alternative
                  setUsePayPalFallback(false)
                  setShowPayPalButtons(false)
                  onPaymentError(error)
                }}
              />
            ) : (
              <div className="space-y-3">
                <PayPalCheckout
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={(error) => {
                    // En cas d'erreur, proposer l'alternative
                    console.error('Erreur PayPal standard:', error)
                    setShowPayPalButtons(false)
                    onPaymentError(`${error}. Essayez le mode alternatif.`)
                  }}
                />
                <Button 
                  onClick={() => {
                    setShowPayPalButtons(false)
                    setUsePayPalFallback(true)
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Problème de chargement ? Essayez le mode alternatif
                </Button>
              </div>
            )}
          </div>
        )

      case 'credit_card':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💳 Payez directement avec votre carte bancaire. Traitement sécurisé via PayPal (pas besoin de compte).
              </p>
            </div>
            
            {!showCreditCardForm ? (
              <Button 
                onClick={() => setShowCreditCardForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payer par carte bancaire
              </Button>
            ) : (
              <CreditCardPayPal
                amount={total}
                currency={currency}
                orderData={orderData}
                onSuccess={onPaymentSuccess}
                onError={(error) => {
                  setShowCreditCardForm(false)
                  onPaymentError(error)
                }}
              />
            )}
          </div>
        )

      case 'digital_wallet':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                📱 Payez rapidement avec Apple Pay, Google Pay ou votre portefeuille digital. Authentification biométrique sécurisée.
              </p>
            </div>
            
            {!showDigitalWallets ? (
              <Button 
                onClick={() => setShowDigitalWallets(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Activer portefeuille digital
              </Button>
            ) : (
              <DigitalWalletsPayPal
                amount={total}
                currency={currency}
                orderData={orderData}
                onSuccess={onPaymentSuccess}
                onError={(error) => {
                  setShowDigitalWallets(false)
                  onPaymentError(error)
                }}
              />
            )}
          </div>
        )
      
      case 'mobile_money':
      case 'cash_on_delivery':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedMethod === 'mobile_money' 
                  ? '📱 Vous recevrez les instructions de paiement Mobile Money par SMS et email après confirmation.'
                  : '🚚 Le paiement sera collecté lors de la livraison. Préparez le montant exact.'
                }
              </p>
            </div>
            <Button 
              onClick={() => handleTraditionalPayment(selectedMethod)}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Traitement...' : 'Confirmer la commande'}
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Méthode de paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={(value) => {
            setSelectedMethod(value)
            // Reset tous les formulaires quand on change de méthode
            if (value !== 'paypal') {
              setShowPayPalButtons(false)
              setUsePayPalFallback(false)
            }
            if (value !== 'credit_card') {
              setShowCreditCardForm(false)
            }
            if (value !== 'digital_wallet') {
              setShowDigitalWallets(false)
            }
          }}
        >
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.enabled}
                    className="shrink-0"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      selectedMethod === method.id ? 'bg-primary text-white' : 'bg-gray-100'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor={method.id} 
                        className="font-medium cursor-pointer"
                      >
                        {method.name}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Affichage du formulaire de paiement selon la méthode sélectionnée */}
        {selectedMethod && renderPaymentForm()}

        {/* Badges de sécurité */}
        <div className="flex items-center justify-center space-x-4 pt-4 border-t">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Paiement sécurisé SSL</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Données protégées</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 