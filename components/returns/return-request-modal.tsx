'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  DollarSign,
  Upload,
  X,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product?: { name: string; images?: string[] }
    service?: { name: string; images?: string[] }
  }>
}

interface ReturnItem {
  orderItemId: string
  quantity: number
  reason: string
  condition: string
  refundAmount: number
}

interface ReturnRequestModalProps {
  eligibleOrders: Order[]
  selectedOrder?: Order | null
  preSelectedItemId?: string | null
  onClose: () => void
  onReturnCreated: (returnRequest: any) => void
}

export function ReturnRequestModal({ eligibleOrders, selectedOrder, preSelectedItemId, onClose, onReturnCreated }: ReturnRequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    orderId: selectedOrder?.id || '',
    reason: '',
    description: '',
    customerNotes: '',
    images: [] as string[]
  })
  const [selectedItems, setSelectedItems] = useState<Map<string, ReturnItem>>(new Map())

  const handleOrderSelect = (orderId: string) => {
    setFormData(prev => ({ ...prev, orderId }))
    setSelectedItems(new Map())
  }

  // Pré-sélectionner l'article si spécifié dans l'URL
  useEffect(() => {
    if (selectedOrder && preSelectedItemId && selectedOrder.items) {
      const item = selectedOrder.items.find(i => i.id === preSelectedItemId)
      if (item) {
        const newSelectedItems = new Map()
        newSelectedItems.set(item.id, {
          orderItemId: item.id,
          quantity: 1,
          reason: '',
          condition: 'USED',
          refundAmount: item.unitPrice
        })
        setSelectedItems(newSelectedItems)
        setStep(2) // Aller directement à l'étape de sélection des articles
      }
    }
  }, [selectedOrder, preSelectedItemId])

  const handleItemToggle = (itemId: string, item: any) => {
    const newSelectedItems = new Map(selectedItems)
    
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId)
    } else {
      newSelectedItems.set(itemId, {
        orderItemId: itemId,
        quantity: 1,
        reason: formData.reason,
        condition: 'USED',
        refundAmount: item.unitPrice
      })
    }
    
    setSelectedItems(newSelectedItems)
  }

  const updateReturnItem = (itemId: string, field: keyof ReturnItem, value: any) => {
    const newSelectedItems = new Map(selectedItems)
    const item = newSelectedItems.get(itemId)
    
    if (item) {
      newSelectedItems.set(itemId, { ...item, [field]: value })
      setSelectedItems(newSelectedItems)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (selectedItems.size === 0) {
        toast.error('Veuillez sélectionner au moins un article à retourner')
        return
      }

      if (!formData.reason) {
        toast.error('Veuillez indiquer la raison du retour')
        return
      }

      const returnItems = Array.from(selectedItems.values())
      
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: formData.orderId,
          reason: formData.reason,
          description: formData.description,
          customerNotes: formData.customerNotes,
          images: formData.images,
          returnItems
        })
      })

      if (response.ok) {
        const returnRequest = await response.json()
        onReturnCreated(returnRequest)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création de la demande')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création de la demande')
    } finally {
      setLoading(false)
    }
  }

  const selectedOrder_data = eligibleOrders.find(o => o.id === formData.orderId)
  const totalRefund = Array.from(selectedItems.values()).reduce((sum, item) => sum + item.refundAmount, 0)

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE': return 'Défectueux'
      case 'WRONG_ITEM': return 'Mauvais article'
      case 'NOT_AS_DESCRIBED': return 'Non conforme à la description'
      case 'CHANGED_MIND': return 'Changement d\'avis'
      case 'DAMAGED_SHIPPING': return 'Endommagé pendant le transport'
      case 'SIZE_ISSUE': return 'Problème de taille'
      case 'QUALITY_ISSUE': return 'Problème de qualité'
      default: return reason
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demande de retour</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Étapes */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2">Commande</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2">Articles</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2">Détails</span>
            </div>
          </div>

          {/* Étape 1: Sélection de la commande */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sélectionnez une commande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eligibleOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.orderId === order.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                      }`}
                      onClick={() => handleOrderSelect(order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Commande #{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {order.items.length} articles • {order.total.toLocaleString()} Ar
                          </p>
                          <p className="text-xs text-gray-500">
                            Commandée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            checked={formData.orderId === order.id}
                            onChange={() => handleOrderSelect(order.id)}
                            className="h-4 w-4 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.orderId}
                  >
                    Continuer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Étape 2: Sélection des articles */}
          {step === 2 && selectedOrder_data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sélectionnez les articles à retourner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedOrder_data.items.map((item) => {
                    const isSelected = selectedItems.has(item.id)
                    const returnItem = selectedItems.get(item.id)
                    
                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleItemToggle(item.id, item)}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {item.product?.name || item.service?.name || item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Prix unitaire: {item.unitPrice.toLocaleString()} Ar • Quantité commandée: {item.quantity}
                            </p>
                            
                            {isSelected && returnItem && (
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">Quantité à retourner</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={item.quantity}
                                    value={returnItem.quantity}
                                    onChange={(e) => updateReturnItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">État de l'article</Label>
                                  <Select
                                    value={returnItem.condition}
                                    onValueChange={(value) => updateReturnItem(item.id, 'condition', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NEW">Neuf (non ouvert)</SelectItem>
                                      <SelectItem value="USED">Utilisé</SelectItem>
                                      <SelectItem value="DAMAGED">Endommagé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {isSelected && returnItem 
                                ? (returnItem.refundAmount * returnItem.quantity).toLocaleString()
                                : item.totalPrice.toLocaleString()
                              } Ar
                            </p>
                            {isSelected && (
                              <Badge variant="secondary" className="mt-1">
                                Sélectionné
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {selectedItems.size > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total du remboursement demandé:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {totalRefund.toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={selectedItems.size === 0}
                  >
                    Continuer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Étape 3: Détails du retour */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Raison du retour
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Raison principale *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une raison" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEFECTIVE">Défectueux</SelectItem>
                        <SelectItem value="WRONG_ITEM">Mauvais article</SelectItem>
                        <SelectItem value="NOT_AS_DESCRIBED">Non conforme à la description</SelectItem>
                        <SelectItem value="DAMAGED_SHIPPING">Endommagé pendant le transport</SelectItem>
                        <SelectItem value="SIZE_ISSUE">Problème de taille</SelectItem>
                        <SelectItem value="QUALITY_ISSUE">Problème de qualité</SelectItem>
                        <SelectItem value="CHANGED_MIND">Changement d'avis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description détaillée</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez le problème en détail..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerNotes">Notes supplémentaires (optionnel)</Label>
                    <Textarea
                      id="customerNotes"
                      value={formData.customerNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
                      placeholder="Informations supplémentaires..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations importantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                      <p>
                        Votre demande sera examinée sous 2-3 jours ouvrables.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                      <p>
                        Les articles doivent être retournés dans leur emballage d'origine si possible.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                      <p>
                        Le remboursement sera effectué sur votre méthode de paiement originale.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !formData.reason}>
                  {loading ? 'Création...' : 'Créer la demande'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}