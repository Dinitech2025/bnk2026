'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  type: string
  isActive: boolean
  order: number
  minAmount: number | null
  maxAmount: number | null
  feeType: string | null
  feeValue: number | null
  processingTime: string | null
  requiresReference: boolean
  requiresTransactionId: boolean
  allowPartialPayments: boolean
  apiEnabled: boolean
  apiEndpoint: string | null
  publicKey: string | null
  settings?: any
}

interface PaymentMethodFormProps {
  isOpen: boolean
  onClose: () => void
  method?: PaymentMethod | null
  onSuccess: () => void
}

const iconOptions = [
  { value: 'CreditCard', label: 'Carte de crédit' },
  { value: 'Smartphone', label: 'Téléphone' },
  { value: 'Building', label: 'Bâtiment/Banque' },
  { value: 'Banknote', label: 'Billet' },
  { value: 'DollarSign', label: 'Dollar' },
  { value: 'Users', label: 'Utilisateurs' }
]

const methodTypeOptions = [
  { value: 'DIRECT', label: 'API Directe', description: 'Méthode avec intégration API (PayPal, cartes)' },
  { value: 'PROVIDERS', label: 'Fournisseurs', description: 'Méthode avec plusieurs fournisseurs (Mobile Money)' },
  { value: 'MANUAL', label: 'Manuel', description: 'Traitement manuel (virement, espèces)' }
]

const feeTypeOptions = [
  { value: 'NONE', label: 'Aucun frais' },
  { value: 'PERCENTAGE', label: 'Pourcentage' },
  { value: 'FIXED', label: 'Montant fixe' }
]

export function PaymentMethodForm({ isOpen, onClose, method, onSuccess }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: 'CreditCard',
    type: 'DIRECT',
    isActive: true,
    order: 0,
    minAmount: '',
    maxAmount: '',
    feeType: 'NONE',
    feeValue: '',
    processingTime: '',
    requiresReference: false,
    requiresTransactionId: false,
    allowPartialPayments: true,
    apiEnabled: false,
    apiEndpoint: '',
    publicKey: ''
  })
  
  const [loading, setLoading] = useState(false)
  const isEditing = !!method

  useEffect(() => {
    if (method) {
      setFormData({
        code: method.code,
        name: method.name,
        description: method.description || '',
        icon: method.icon || 'CreditCard',
        type: method.type || 'DIRECT',
        isActive: method.isActive,
        order: method.order,
        minAmount: method.minAmount ? method.minAmount.toString() : '',
        maxAmount: method.maxAmount ? method.maxAmount.toString() : '',
        feeType: method.feeType || 'NONE',
        feeValue: method.feeValue ? method.feeValue.toString() : '',
        processingTime: method.processingTime || '',
        requiresReference: method.requiresReference,
        requiresTransactionId: method.requiresTransactionId,
        allowPartialPayments: method.allowPartialPayments,
        apiEnabled: method.apiEnabled,
        apiEndpoint: method.apiEndpoint || '',
        publicKey: method.publicKey || ''
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        icon: 'CreditCard',
        type: 'DIRECT',
        isActive: true,
        order: 0,
        minAmount: '',
        maxAmount: '',
        feeType: 'NONE',
        feeValue: '',
        processingTime: '',
        requiresReference: false,
        requiresTransactionId: false,
        allowPartialPayments: true,
        apiEnabled: false,
        apiEndpoint: '',
        publicKey: ''
      })
    }
  }, [method, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing 
        ? `/api/admin/payment-methods/${method.id}`
        : '/api/admin/payment-methods'
      
      const method_method = isEditing ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        feeValue: formData.feeValue && formData.feeType !== 'NONE' 
          ? parseFloat(formData.feeValue) 
          : null,
        order: parseInt(formData.order.toString()) || 0
      }

      const response = await fetch(url, {
        method: method_method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(`Méthode de paiement ${isEditing ? 'modifiée' : 'créée'} avec succès`)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la méthode de paiement' : 'Nouvelle méthode de paiement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Ex: paypal, mobile_money"
                required
                disabled={isEditing} // Le code ne peut pas être modifié
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: PayPal"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de la méthode de paiement"
              rows={2}
            />
          </div>

          {/* Type de méthode */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de méthode *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methodTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration d'affichage */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icône</Label>
              <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Ordre d'affichage</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processingTime">Temps de traitement</Label>
              <Input
                id="processingTime"
                value={formData.processingTime}
                onChange={(e) => handleInputChange('processingTime', e.target.value)}
                placeholder="Ex: Instantané, 24h"
              />
            </div>
          </div>

          {/* Limites de montant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Montant minimum (Ar)</Label>
              <Input
                id="minAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.minAmount}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                placeholder="Montant minimum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Montant maximum (Ar)</Label>
              <Input
                id="maxAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.maxAmount}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                placeholder="Montant maximum"
              />
            </div>
          </div>

          {/* Configuration des frais */}
          <div className="space-y-4">
            <Label>Configuration des frais</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feeType">Type de frais</Label>
                <Select value={formData.feeType} onValueChange={(value) => handleInputChange('feeType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.feeType !== 'NONE' && (
                <div className="space-y-2">
                  <Label htmlFor="feeValue">
                    Valeur des frais {formData.feeType === 'PERCENTAGE' ? '(%)' : '(Ar)'}
                  </Label>
                  <Input
                    id="feeValue"
                    type="number"
                    min="0"
                    step={formData.feeType === 'PERCENTAGE' ? '0.01' : '1'}
                    value={formData.feeValue}
                    onChange={(e) => handleInputChange('feeValue', e.target.value)}
                    placeholder={formData.feeType === 'PERCENTAGE' ? 'Ex: 3.5' : 'Ex: 1000'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Configuration API pour les méthodes DIRECT */}
          {formData.type === 'DIRECT' && (
            <div className="space-y-4">
              <Label>Configuration API</Label>
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiEnabled">API activée</Label>
                  <Switch
                    id="apiEnabled"
                    checked={formData.apiEnabled}
                    onCheckedChange={(checked) => handleInputChange('apiEnabled', checked)}
                  />
                </div>
                
                {formData.apiEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="apiEndpoint">Endpoint API</Label>
                      <Input
                        id="apiEndpoint"
                        value={formData.apiEndpoint}
                        onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                        placeholder="https://api.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publicKey">Clé publique / Client ID</Label>
                      <Input
                        id="publicKey"
                        value={formData.publicKey}
                        onChange={(e) => handleInputChange('publicKey', e.target.value)}
                        placeholder="Clé publique ou Client ID"
                      />
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                      💡 Pour PayPal: utilisez NEXT_PUBLIC_PAYPAL_CLIENT_ID dans les variables d'environnement
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Informations sur les fournisseurs */}
          {formData.type === 'PROVIDERS' && (
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Label>Gestion des fournisseurs</Label>
              </div>
              <p className="text-sm text-green-700">
                Cette méthode utilise des fournisseurs multiples. Vous pourrez les gérer après la création de la méthode.
              </p>
              <p className="text-xs text-green-600 mt-2">
                Exemple : Orange Money, MVola, Airtel Money pour Mobile Money
              </p>
            </div>
          )}

          {/* Informations sur le traitement manuel */}
          {formData.type === 'MANUAL' && (
            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <Label>Traitement manuel</Label>
              </div>
              <p className="text-sm text-yellow-700">
                Cette méthode nécessite un traitement manuel des paiements (virement bancaire, espèces, etc.).
              </p>
            </div>
          )}

          {/* Options d'interface */}
          <div className="space-y-4">
            <Label>Options d'interface</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="requiresReference">Nécessite une référence</Label>
                <Switch
                  id="requiresReference"
                  checked={formData.requiresReference}
                  onCheckedChange={(checked) => handleInputChange('requiresReference', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requiresTransactionId">Nécessite un ID de transaction</Label>
                <Switch
                  id="requiresTransactionId"
                  checked={formData.requiresTransactionId}
                  onCheckedChange={(checked) => handleInputChange('requiresTransactionId', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowPartialPayments">Permet les paiements partiels</Label>
                <Switch
                  id="allowPartialPayments"
                  checked={formData.allowPartialPayments}
                  onCheckedChange={(checked) => handleInputChange('allowPartialPayments', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Méthode active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
