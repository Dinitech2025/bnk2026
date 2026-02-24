'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CreditCard, Smartphone, Building, Banknote, Loader2 } from 'lucide-react'
import { useCurrency } from '@/components/providers/currency-provider'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderTotal: number
  currency: string
  orderNumber?: string
  onPaymentSuccess: () => void
}

interface ExistingPayment {
  id: string
  amount: number
  currency: string
  method: string | null
  provider: string | null
  status: string
  transactionId: string | null
  reference: string | null
  notes: string | null
  createdAt: string
  paymentMethod?: {
    name: string
    icon: string | null
  }
  paymentProvider?: {
    name: string
  }
  processedByUser?: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
  }
}

interface PaymentFormData {
  amount: number
  methodId: string
  providerId: string
  method: string // Conservé pour compatibilité
  provider: string // Conservé pour compatibilité
  transactionId: string
  reference: string
  notes: string
}

interface PaymentMethod {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  type: string
  isActive: boolean
  requiresReference: boolean
  requiresTransactionId: boolean
  allowPartialPayments: boolean
  minAmount: number | null
  maxAmount: number | null
  feeType: string | null
  feeValue: number | null
  processingTime: string | null
  apiEnabled: boolean
  apiEndpoint: string | null
  publicKey: string | null
  providers: PaymentProvider[]
  calculatedFee?: number | null
}

interface PaymentProvider {
  id: string
  code: string
  name: string
  description: string | null
  logo: string | null
  isActive: boolean
  feeType: string | null
  feeValue: number | null
  minAmount: number | null
  maxAmount: number | null
  dailyLimit: number | null
  calculatedFee?: number | null
  totalFee?: number | null
  finalAmount?: number | null
}

const iconMap: Record<string, any> = {
  CreditCard,
  Smartphone,
  Building,
  Banknote
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  currency,
  orderNumber,
  onPaymentSuccess
}: PaymentModalProps) {
  const { targetCurrency } = useCurrency()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [existingPayments, setExistingPayments] = useState<ExistingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [remainingAmount, setRemainingAmount] = useState(orderTotal)
  const [totalPaid, setTotalPaid] = useState(0)
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0, // Sera calculé automatiquement
    methodId: '',
    providerId: '',
    method: '',
    provider: '',
    transactionId: '',
    reference: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedMethod = paymentMethods.find(m => m.id === formData.methodId)
  const selectedProvider = selectedMethod?.providers.find(p => p.id === formData.providerId)

  // Charger les méthodes de paiement et les paiements existants
  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods()
      fetchExistingPayments()
    }
  }, [isOpen, orderTotal])

  // Calculer le montant restant quand les paiements existants changent
  useEffect(() => {
    const paid = existingPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    
    setTotalPaid(paid)
    const remaining = Math.max(0, orderTotal - paid)
    setRemainingAmount(remaining)
    
    // Pré-remplir le montant avec le montant restant
    setFormData(prev => ({
      ...prev,
      amount: remaining
    }))
  }, [existingPayments, orderTotal])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payment-methods?includeInactive=false&amount=${orderTotal}&currency=${currency}`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error('Erreur lors du chargement des méthodes de paiement:', error)
      toast.error('Erreur lors du chargement des méthodes de paiement')
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingPayments = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payments`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const payments = await response.json()
      console.log('Paiements récupérés:', payments) // Debug
      setExistingPayments(payments || [])
    } catch (error) {
      console.error('Erreur lors du chargement des paiements existants:', error)
      toast.error('Erreur lors du chargement des paiements existants')
    }
  }

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: orderTotal,
        methodId: '',
        providerId: '',
        method: '',
        provider: '',
        transactionId: '',
        reference: '',
        notes: ''
      })
    }
  }, [isOpen, orderTotal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.methodId) {
      toast.error('Veuillez sélectionner une méthode de paiement')
      return
    }

    // Vérifier le fournisseur seulement pour les méthodes PROVIDERS
    if (selectedMethod?.type === 'PROVIDERS' && !formData.providerId) {
      toast.error('Veuillez sélectionner un fournisseur Mobile Money')
      return
    }

    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }

    if (formData.amount > remainingAmount) {
      toast.error(`Le montant ne peut pas dépasser le montant restant (${remainingAmount.toLocaleString()} ${currency})`)
      return
    }

    if (formData.amount > orderTotal) {
      toast.error(`Le montant ne peut pas dépasser ${orderTotal} ${currency}`)
      return
    }

    // Vérifier les limites du fournisseur
    if (selectedProvider) {
      if (selectedProvider.minAmount && formData.amount < Number(selectedProvider.minAmount)) {
        toast.error(`Le montant minimum pour ${selectedProvider.name} est ${selectedProvider.minAmount} ${currency}`)
        return
      }
      if (selectedProvider.maxAmount && formData.amount > Number(selectedProvider.maxAmount)) {
        toast.error(`Le montant maximum pour ${selectedProvider.name} est ${selectedProvider.maxAmount} ${currency}`)
        return
      }
    }

    // Vérifier les champs obligatoires selon la méthode
    if (selectedMethod?.requiresTransactionId && !formData.transactionId.trim()) {
      toast.error('L\'ID de transaction est obligatoire pour cette méthode')
      return
    }

    if (selectedMethod?.requiresReference && !formData.reference.trim()) {
      toast.error('La référence est obligatoire pour cette méthode')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: formData.amount,
          methodId: formData.methodId,
          providerId: formData.providerId,
          // Maintenir la compatibilité avec l'ancien format
          method: selectedMethod?.code,
          provider: selectedProvider?.code,
          transactionId: formData.transactionId || undefined,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
          displayCurrency: targetCurrency || currency // Capturer la devise d'affichage actuelle
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'enregistrement du paiement')
      }

      const result = await response.json()
      
      const finalAmount = selectedProvider?.finalAmount || formData.amount
      const feeInfo = selectedProvider?.totalFee ? ` (dont ${selectedProvider.totalFee} ${currency} de frais)` : ''
      
      toast.success(`Paiement de ${formData.amount} ${currency} enregistré avec succès${feeInfo}`)
      
      onPaymentSuccess()
      onClose()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du paiement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMethodChange = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId)
    setFormData(prev => ({
      ...prev,
      methodId,
      providerId: '', // Reset provider when method changes
      method: method?.code || '',
      provider: ''
    }))
  }

  const handleProviderChange = (providerId: string) => {
    const provider = selectedMethod?.providers.find(p => p.id === providerId)
    setFormData(prev => ({
      ...prev,
      providerId,
      provider: provider?.code || ''
    }))
  }

  const formatFee = (feeType: string | null, feeValue: number | null) => {
    if (!feeType || !feeValue || feeType === 'NONE') return null
    if (feeType === 'PERCENTAGE') return `${feeValue}%`
    if (feeType === 'FIXED') return `${feeValue} ${currency}`
    return null
  }

  const getIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return CreditCard
    return iconMap[iconName]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Enregistrer un paiement
          </DialogTitle>
          {orderNumber && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Commande: {orderNumber} • Total: {orderTotal.toLocaleString()} {currency}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  Payé: {totalPaid.toLocaleString()} {currency}
                </span>
                <span className="text-orange-600 font-medium">
                  Restant: {remainingAmount.toLocaleString()} {currency}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Paiements existants */}
        {existingPayments.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Paiements effectués</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {existingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm bg-white rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
                      {payment.status === 'COMPLETED' ? 'Validé' : payment.status}
                    </Badge>
                    <span className="text-gray-600">
                      {payment.paymentMethod?.name || payment.method || 'Méthode inconnue'}
                    </span>
                  </div>
                  <span className="font-medium">
                    {Number(payment.amount).toLocaleString()} {payment.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingAmount}
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
              {/* Boutons de raccourci */}
              <div className="flex gap-1 flex-wrap">
                {remainingAmount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setFormData(prev => ({ ...prev, amount: remainingAmount }))}
                  >
                    Restant ({remainingAmount.toLocaleString()})
                  </Button>
                )}
                {[25, 50, 75].map(percent => {
                  const amount = Math.round((remainingAmount * percent) / 100)
                  return amount > 0 ? (
                    <Button
                      key={percent}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => setFormData(prev => ({ ...prev, amount }))}
                    >
                      {percent}%
                    </Button>
                  ) : null
                })}
              </div>
            </div>
            <div>
              <Label>Devise</Label>
              <Input value={currency} disabled />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Chargement des méthodes de paiement...
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="method">Méthode de paiement *</Label>
                <Select value={formData.methodId} onValueChange={handleMethodChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => {
                      const Icon = getIcon(method.icon)
                      const fee = formatFee(method.feeType, method.feeValue)
                      const typeLabel = method.type === 'DIRECT' ? '🔗 API' : method.type === 'PROVIDERS' ? '👥 Fournisseurs' : '✋ Manuel'
                      return (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{method.name}</span>
                                  <span className="text-xs text-gray-500">{typeLabel}</span>
                                </div>
                                {method.processingTime && (
                                  <div className="text-xs text-gray-400">⏱️ {method.processingTime}</div>
                                )}
                              </div>
                            </div>
                            {fee && <Badge variant="outline" className="text-xs ml-2">{fee}</Badge>}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {selectedMethod && selectedMethod.description && (
                  <p className="text-xs text-gray-600 mt-1">{selectedMethod.description}</p>
                )}
              </div>

              {/* Sélection de fournisseur - seulement pour les méthodes PROVIDERS */}
              {selectedMethod && selectedMethod.type === 'PROVIDERS' && selectedMethod.providers.length > 0 && (
                <div>
                  <Label htmlFor="provider">Fournisseur Mobile Money *</Label>
                  <Select value={formData.providerId} onValueChange={handleProviderChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMethod.providers.map((provider) => {
                        const fee = formatFee(provider.feeType, provider.feeValue)
                        const limits = []
                        if (provider.minAmount) limits.push(`Min: ${provider.minAmount} ${currency}`)
                        if (provider.maxAmount) limits.push(`Max: ${provider.maxAmount} ${currency}`)
                        
                        return (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {provider.logo && (
                                  <img src={provider.logo} alt={provider.name} className="w-4 h-4 object-contain" />
                                )}
                                <span>{provider.name}</span>
                                {fee && <Badge variant="outline" className="text-xs">{fee}</Badge>}
                              </div>
                              {limits.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">{limits.join(' • ')}</p>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedProvider && selectedProvider.description && (
                    <p className="text-xs text-gray-600 mt-1">{selectedProvider.description}</p>
                  )}
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    📱 Contactez le client pour qu'il effectue le paiement via {selectedProvider?.name || 'le fournisseur sélectionné'}
                  </div>
                </div>
              )}

              {/* Information pour les méthodes DIRECT */}
              {selectedMethod && selectedMethod.type === 'DIRECT' && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-green-700">🔗 Paiement en ligne</span>
                  </div>
                  <p className="text-xs text-green-600">
                    {selectedMethod.apiEnabled 
                      ? `Cette méthode utilise l'API ${selectedMethod.name} pour traiter les paiements automatiquement.`
                      : `Configuration API requise pour ${selectedMethod.name}.`
                    }
                  </p>
                </div>
              )}

              {/* Information pour les méthodes MANUAL */}
              {selectedMethod && selectedMethod.type === 'MANUAL' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-yellow-700">✋ Traitement manuel</span>
                  </div>
                  <p className="text-xs text-yellow-600">
                    Ce paiement nécessite une vérification manuelle de votre part après réception.
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="transactionId">
              ID de transaction
              {selectedMethod?.requiresTransactionId && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id="transactionId"
              value={formData.transactionId}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
              placeholder="ID ou numéro de transaction"
              required={selectedMethod?.requiresTransactionId}
            />
            {selectedMethod?.requiresTransactionId && (
              <p className="text-xs text-red-600 mt-1">Obligatoire pour cette méthode de paiement</p>
            )}
          </div>

          <div>
            <Label htmlFor="reference">
              Référence
              {selectedMethod?.requiresReference && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Référence du paiement"
              required={selectedMethod?.requiresReference}
            />
            {selectedMethod?.requiresReference && (
              <p className="text-xs text-red-600 mt-1">Obligatoire pour cette méthode de paiement</p>
            )}
          </div>

          {/* Affichage des frais calculés */}
          {selectedProvider && selectedProvider.totalFee !== null && selectedProvider.totalFee > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Montant du paiement:</span>
                <span>{formData.amount} {currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-amber-700">
                <span>Frais:</span>
                <span>{selectedProvider.totalFee} {currency}</span>
              </div>
              <div className="flex items-center justify-between font-medium text-sm border-t border-amber-200 mt-2 pt-2">
                <span>Total:</span>
                <span>{selectedProvider.finalAmount || formData.amount} {currency}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes ou commentaires sur le paiement"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le paiement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
