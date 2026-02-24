'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone, Building, Banknote, Loader, Truck } from 'lucide-react'
import { PayPalSimple } from './paypal-simple'
import { toast } from '@/components/ui/use-toast'

interface PaymentProvider {
  id: string
  code: string
  name: string
  description: string | null
  logo: string | null
  isActive: boolean
  order: number
  feeType: string | null
  feeValue: string | null
  minAmount: string | null
  maxAmount: string | null
  dailyLimit: string | null
  settings: any
  calculatedFee?: number | null
}

interface PaymentMethod {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null | React.ReactNode
  isActive: boolean
  enabled?: boolean
  order: number
  type: string
  minAmount: string | null
  maxAmount: string | null
  feeType: string | null
  feeValue: string | null
  processingTime: string | null
  requiresReference: boolean
  requiresTransactionId: boolean
  allowPartialPayments: boolean
  apiEnabled: boolean
  apiEndpoint: string | null
  publicKey: string | null
  settings: any
  providers: PaymentProvider[]
  calculatedFee?: number | null
}

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
  
  // Debug du montant reçu
  console.log('💰 PaymentMethodSelector reçu:', { total, currency, orderData });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPaymentMethods()
  }, [total, currency])

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Chargement méthodes paiement:', { total, currency })
      const response = await fetch(`/api/payment-methods?amount=${total}&currency=${currency}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erreur API méthodes paiement:', response.status, errorData)
        throw new Error(errorData.error || 'Erreur lors du chargement des méthodes de paiement')
      }

      const data = await response.json()
      console.log('✅ Méthodes paiement reçues:', data)
      
      const transformedMethods = (data.paymentMethods || []).map(method => ({
        ...method,
        enabled: method.isActive && (method.type !== 'PROVIDERS' || method.providers.length > 0),
        icon: getMethodIcon(method.icon, method.type)
      }))
      
      console.log('🔄 Méthodes transformées:', transformedMethods)
      setPaymentMethods(transformedMethods)
    } catch (error) {
      console.error('❌ Erreur chargement méthodes paiement:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les méthodes de paiement",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMethodIcon = (iconName: string | null, type: string) => {
    switch (iconName || type) {
      case 'CreditCard':
      case 'DIRECT':
        return <CreditCard className="h-5 w-5" />
      case 'Smartphone':
      case 'PROVIDERS':
        return <Smartphone className="h-5 w-5" />
      case 'Building':
        return <Building className="h-5 w-5" />
      case 'Banknote':
      case 'MANUAL':
        return <Banknote className="h-5 w-5" />
      case 'Truck':
        return <Truck className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const renderPaymentForm = () => {
    if (!selectedMethod) return null

    switch (selectedMethod.code) {
      case 'paypal':
        // Pour PayPal, vérifier si un fournisseur est sélectionné (si nécessaire)
        if (selectedMethod.type === 'PROVIDERS' && !selectedProvider) {
          return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Veuillez sélectionner un fournisseur PayPal ci-dessus
              </p>
            </div>
          )
        }
        
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💳 Paiement sécurisé avec PayPal - Restez sur cette page
              </p>
              {selectedProvider && (
                <p className="text-xs text-blue-700 mt-1">
                  Fournisseur : {selectedProvider.name}
                </p>
              )}
            </div>
            
            <PayPalSimple
              amount={total}
              currency={currency}
              orderData={orderData}
              provider={selectedProvider}
              onSuccess={onPaymentSuccess}
              onError={(error) => {
                console.error('Erreur PayPal:', error)
                onPaymentError('Erreur lors du paiement PayPal. Veuillez réessayer.')
              }}
            />
          </div>
        )

      case 'online_payment':
        // Nouvelle méthode : Paiement en ligne avec fournisseurs (PayPal, carte bancaire)
        if (selectedMethod.providers && selectedMethod.providers.length > 0) {
          if (!selectedProvider) {
            return (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Veuillez choisir PayPal ou Carte bancaire ci-dessus
                </p>
              </div>
            )
          }

          // Gestion PayPal provider
          if (selectedProvider.code === 'paypal') {
            return (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💳 Paiement sécurisé avec PayPal - Connectez-vous avec votre compte PayPal
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Vous pouvez utiliser votre compte PayPal ou payer directement par carte.
                  </p>
                </div>
                
                <PayPalSimple
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  provider={selectedProvider}
                  onSuccess={onPaymentSuccess}
                  onError={(error) => {
                    console.error('Erreur PayPal:', error)
                    onPaymentError('Erreur lors du paiement PayPal. Veuillez réessayer.')
                  }}
                />
              </div>
            )
          }

          // Gestion carte bancaire provider
          if (selectedProvider.code === 'card_payment') {
            return (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    💳 Paiement par carte bancaire - Traitement sécurisé via PayPal
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Aucun compte PayPal requis. Entrez directement vos informations de carte.
                  </p>
                </div>
                
                <PayPalSimple
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  provider={selectedProvider}
                  onSuccess={onPaymentSuccess}
                  onError={(error) => {
                    console.error('Erreur paiement carte:', error)
                    onPaymentError('Erreur lors du paiement par carte. Veuillez réessayer.')
                  }}
                />
              </div>
            )
          }
        }
        
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              🚧 Configuration du paiement en cours...
            </p>
          </div>
        )

      case 'mobile_money':
      case 'cash':
      case 'bank_transfer':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedMethod.code === 'mobile_money' 
                  ? '📱 Paiement via Mobile Money. Fonctionnalité bientôt disponible.'
                  : selectedMethod.code === 'cash'
                  ? '🚚 Vous payerez en espèces lors de la livraison.'
                  : '🏦 Effectuez un virement bancaire avec les coordonnées qui vous seront communiquées.'
                }
              </p>
            </div>
            
            {(selectedMethod.code === 'cash' || selectedMethod.code === 'bank_transfer') && (
            <Button 
                onClick={() => {
                  onPaymentSuccess({
                    method: selectedMethod.code,
                    status: 'pending',
                    message: selectedMethod.code === 'cash' 
                      ? 'Commande confirmée - Paiement à la livraison'
                      : 'Commande confirmée - Paiement par virement bancaire'
                  })
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
            >
                {selectedMethod.code === 'cash' ? (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Confirmer la commande
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4 mr-2" />
                    Confirmer la commande
                  </>
                )}
            </Button>
            )}

            {selectedMethod.code === 'mobile_money' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  🚧 Fonctionnalité en développement
                </p>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des méthodes de paiement...</span>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune méthode de paiement disponible</p>
          </div>
        ) : (
        <RadioGroup 
          value={selectedMethodId || ''} 
          onValueChange={(value) => {
            setSelectedMethodId(value)
            const method = paymentMethods.find(m => m.id === value)
            setSelectedMethod(method || null)
            setSelectedProvider(null) // Reset provider when changing method
          }}
        >
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethodId === method.id
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Label
                  htmlFor={method.id}
                  className={`flex items-center space-x-3 cursor-pointer ${
                    !method.enabled ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.enabled}
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center space-x-2">
                        <span>{method.name}</span>
                        {!method.enabled && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Bientôt
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.description}
                      </div>
                      {method.type === 'PROVIDERS' && method.providers.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {method.providers.length} fournisseur{method.providers.length > 1 ? 's' : ''} disponible{method.providers.length > 1 ? 's' : ''}
                        </div>
                      )}
                  </div>
                </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        )}

        {/* Sélection du fournisseur si nécessaire */}
        {selectedMethod && selectedMethod.providers && selectedMethod.providers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Choisissez votre mode de paiement :</h4>
            <RadioGroup 
              value={selectedProvider?.id || ''} 
              onValueChange={(value) => {
                const provider = selectedMethod.providers.find(p => p.id === value)
                setSelectedProvider(provider || null)
              }}
            >
              <div className="grid grid-cols-1 gap-2">
                {selectedMethod.providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedProvider?.id === provider.id
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Label
                      htmlFor={provider.id}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <RadioGroupItem
                        value={provider.id}
                        id={provider.id}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{provider.name}</div>
                            {provider.description && (
                              <div className="text-sm text-gray-500">{provider.description}</div>
                            )}
                          </div>
                          {provider.calculatedFee !== undefined && provider.calculatedFee > 0 && (
                            <div className="text-sm text-gray-600">
                              +{provider.calculatedFee.toLocaleString()} {currency} frais
                            </div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {renderPaymentForm()}

        {selectedMethod && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center font-semibold">
              <span>Total à payer :</span>
              <span className="text-lg">
                {total.toLocaleString()} {currency}
                {currency === 'Ar' && (
                  <span className="text-sm text-gray-600 ml-2">
                    (≈ {(total / 5000).toFixed(2)}€)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
    </div>
  )
} 
