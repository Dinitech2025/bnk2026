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
}

interface BankMethodFormProps {
  isOpen: boolean
  onClose: () => void
  method: PaymentMethod | null
  onSuccess: () => void
}

const feeTypeOptions = [
  { value: 'NONE', label: 'Aucun frais' },
  { value: 'PERCENTAGE', label: 'Pourcentage' },
  { value: 'FIXED', label: 'Montant fixe' }
]

export function BankMethodForm({ isOpen, onClose, method, onSuccess }: BankMethodFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: 'Building',
    type: 'MANUAL',
    isActive: true,
    order: 0,
    minAmount: '',
    maxAmount: '',
    feeType: 'NONE',
    feeValue: '',
    processingTime: '',
    requiresReference: true,
    requiresTransactionId: true,
    allowPartialPayments: false,
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
        icon: method.icon || 'Building',
        type: method.type || 'MANUAL',
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
        icon: 'Building',
        type: 'MANUAL',
        isActive: true,
        order: 0,
        minAmount: '',
        maxAmount: '',
        feeType: 'NONE',
        feeValue: '',
        processingTime: '',
        requiresReference: true,
        requiresTransactionId: true,
        allowPartialPayments: false,
        apiEnabled: false,
        apiEndpoint: '',
        publicKey: ''
      })
    }
  }, [method, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        code: formData.code || `bank_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        type: formData.type,
        isActive: formData.isActive,
        order: formData.order,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        feeType: formData.feeType,
        feeValue: formData.feeValue ? parseFloat(formData.feeValue) : null,
        processingTime: formData.processingTime || null,
        requiresReference: formData.requiresReference,
        requiresTransactionId: formData.requiresTransactionId,
        allowPartialPayments: formData.allowPartialPayments,
        apiEnabled: formData.apiEnabled,
        apiEndpoint: formData.apiEndpoint || null,
        publicKey: formData.publicKey || null
      }

      const url = method 
        ? `/api/admin/payment-methods/${method.id}`
        : '/api/admin/payment-methods'
      
      const method_http = method ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method_http,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(isEditing ? 'Méthode bancaire modifiée' : 'Méthode bancaire créée')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la méthode bancaire' : 'Nouvelle méthode bancaire'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Ex: bank_transfer"
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Virement bancaire"
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
              placeholder="Description de la méthode bancaire"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Montant minimum (Ar)</Label>
              <Input
                id="minAmount"
                type="number"
                value={formData.minAmount}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Montant maximum (Ar)</Label>
              <Input
                id="maxAmount"
                type="number"
                value={formData.maxAmount}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                placeholder="Illimité"
              />
            </div>
          </div>

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
                <Label htmlFor="feeValue">Valeur des frais</Label>
                <Input
                  id="feeValue"
                  type="number"
                  value={formData.feeValue}
                  onChange={(e) => handleInputChange('feeValue', e.target.value)}
                  placeholder={formData.feeType === 'PERCENTAGE' ? 'Ex: 2.5' : 'Ex: 1000'}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="processingTime">Délai de traitement</Label>
            <Input
              id="processingTime"
              value={formData.processingTime}
              onChange={(e) => handleInputChange('processingTime', e.target.value)}
              placeholder="Ex: 1-3 jours ouvrables"
            />
          </div>

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
              <Label htmlFor="isActive">Actif</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

