'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Package, Truck } from 'lucide-react'
import { toast } from 'sonner'

interface DeliveryMethod {
  id?: string
  name: string
  description: string
  type: 'api' | 'manual'
  isActive: boolean
  apiConfig?: {
    provider: string
    apiKey: string
    endpoint: string
  }
  estimatedDays: {
    min: number
    max: number
  }
  icon: string
  createdAt?: string
}

interface DeliveryMethodFormProps {
  method?: DeliveryMethod | null
  onSave: (method: DeliveryMethod) => void
  onCancel: () => void
}

export function DeliveryMethodForm({ method, onSave, onCancel }: DeliveryMethodFormProps) {
  const [formData, setFormData] = useState<DeliveryMethod>({
    name: '',
    description: '',
    type: 'manual',
    isActive: true,
    estimatedDays: { min: 1, max: 3 },
    icon: 'truck'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (method) {
      setFormData(method)
    }
  }, [method])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = method?.id 
        ? `/api/admin/delivery-methods/${method.id}`
        : '/api/admin/delivery-methods'
      
      const response = await fetch(url, {
        method: method?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedMethod = await response.json()
        onSave(savedMethod)
        toast.success(`Mode de livraison ${method ? 'modifié' : 'créé'} avec succès !`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof DeliveryMethod, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEstimatedDaysChange = (field: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      estimatedDays: {
        ...prev.estimatedDays,
        [field]: value
      }
    }))
  }

  const handleApiConfigChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      apiConfig: {
        ...prev.apiConfig,
        [field]: value
      } as any
    }))
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {method ? 'Modifier le mode de livraison' : 'Nouveau mode de livraison'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du mode *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: DHL Express, Livraison Standard"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'api' | 'manual') => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Manuel
                        </div>
                      </SelectItem>
                      <SelectItem value="api">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          API
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description du mode de livraison"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minDays">Délai minimum (jours) *</Label>
                  <Input
                    id="minDays"
                    type="number"
                    min="1"
                    value={formData.estimatedDays.min}
                    onChange={(e) => handleEstimatedDaysChange('min', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDays">Délai maximum (jours) *</Label>
                  <Input
                    id="maxDays"
                    type="number"
                    min="1"
                    value={formData.estimatedDays.max}
                    onChange={(e) => handleEstimatedDaysChange('max', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Mode actif</Label>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          {formData.type === 'api' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configuration API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Fournisseur *</Label>
                  <Select
                    value={formData.apiConfig?.provider || ''}
                    onValueChange={(value) => handleApiConfigChange('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="Colissimo">Colissimo</SelectItem>
                      <SelectItem value="Custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoint">URL de l'API *</Label>
                  <Input
                    id="endpoint"
                    value={formData.apiConfig?.endpoint || ''}
                    onChange={(e) => handleApiConfigChange('endpoint', e.target.value)}
                    placeholder="https://api.provider.com/v1"
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">Clé API *</Label>
                  <Input
                    id="apiKey"
                    value={formData.apiConfig?.apiKey || ''}
                    onChange={(e) => handleApiConfigChange('apiKey', e.target.value)}
                    placeholder="Votre clé API"
                    type="password"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (method ? 'Sauvegarder' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
