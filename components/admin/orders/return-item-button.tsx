'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { RotateCcw, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  metadata: any
  product?: {
    id: string
    name: string
  }
  service?: {
    id: string
    name: string
  }
  offer?: {
    id: string
    name: string
  }
}

interface ReturnItemButtonProps {
  orderItem: OrderItem
  orderId: string
  orderNumber: string
  currency: string
  onReturnCreated?: () => void
}

const returnReasons = [
  { value: 'DEFECTIVE', label: 'Défectueux' },
  { value: 'WRONG_ITEM', label: 'Article incorrect' },
  { value: 'NOT_AS_DESCRIBED', label: 'Non conforme à la description' },
  { value: 'DAMAGED_DELIVERY', label: 'Endommagé lors de la livraison' },
  { value: 'SIZE_ISSUE', label: 'Problème de taille' },
  { value: 'QUALITY_ISSUE', label: 'Problème de qualité' },
  { value: 'CHANGED_MIND', label: 'Changement d\'avis du client' },
  { value: 'OTHER', label: 'Autre raison' }
]

const itemConditions = [
  { value: 'NEW', label: 'Neuf' },
  { value: 'USED', label: 'Utilisé' },
  { value: 'DAMAGED', label: 'Endommagé' },
  { value: 'DEFECTIVE', label: 'Défectueux' },
  { value: 'UNKNOWN', label: 'État inconnu' }
]

function getItemName(orderItem: OrderItem) {
  if (orderItem.product?.name) return orderItem.product.name
  if (orderItem.service?.name) return orderItem.service.name
  if (orderItem.offer?.name) return orderItem.offer.name
  
  // Fallback vers metadata
  try {
    const metadata = typeof orderItem.metadata === 'string' 
      ? JSON.parse(orderItem.metadata) 
      : orderItem.metadata
    return metadata?.name || 'Article inconnu'
  } catch {
    return 'Article inconnu'
  }
}

export function ReturnItemButton({ orderItem, orderId, orderNumber, currency, onReturnCreated }: ReturnItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    quantity: 1,
    reason: '',
    condition: 'UNKNOWN',
    description: '',
    adminNotes: ''
  })

  const itemName = getItemName(orderItem)
  const maxRefundAmount = orderItem.unitPrice * formData.quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reason) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une raison pour le retour",
        variant: "destructive"
      })
      return
    }

    if (formData.quantity <= 0 || formData.quantity > orderItem.quantity) {
      toast({
        title: "Erreur", 
        description: "Quantité invalide",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          items: [{
            orderItemId: orderItem.id,
            quantity: formData.quantity,
            reason: formData.reason,
            condition: formData.condition,
            refundAmount: maxRefundAmount
          }],
          reason: formData.reason,
          description: formData.description,
          adminNotes: formData.adminNotes,
          status: 'APPROVED' // Les retours admin sont automatiquement approuvés
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création du retour')
      }

      const result = await response.json()

      toast({
        title: "Retour créé",
        description: `Retour ${result.return.returnNumber} créé avec succès`,
      })

      setIsOpen(false)
      setFormData({
        quantity: 1,
        reason: '',
        condition: 'UNKNOWN', 
        description: '',
        adminNotes: ''
      })

      if (onReturnCreated) {
        onReturnCreated()
      }

    } catch (error: any) {
      console.error('Erreur création retour:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le retour",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <RotateCcw className="h-3 w-3 mr-1" />
          Retour
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un retour</DialogTitle>
          <DialogDescription>
            Créer une demande de retour pour l'article "{itemName}" de la commande #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations sur l'article */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm">{itemName}</p>
            <p className="text-xs text-gray-600">
              Prix unitaire: {orderItem.unitPrice.toLocaleString()} {currency} • 
              Quantité disponible: {orderItem.quantity}
            </p>
          </div>

          {/* Quantité à retourner */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité à retourner</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={orderItem.quantity}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                quantity: parseInt(e.target.value) || 1 
              }))}
              required
            />
          </div>

          {/* Raison du retour */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du retour</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une raison" />
              </SelectTrigger>
              <SelectContent>
                {returnReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* État de l'article */}
          <div className="space-y-2">
            <Label htmlFor="condition">État de l'article</Label>
            <Select 
              value={formData.condition} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemConditions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description du problème</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème avec l'article..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Notes admin */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Notes administratives</Label>
            <Textarea
              id="adminNotes"
              placeholder="Notes internes (optionnel)..."
              value={formData.adminNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Montant de remboursement */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              Montant de remboursement: {maxRefundAmount.toLocaleString()} {currency}
            </p>
            <p className="text-xs text-blue-600">
              {formData.quantity} × {orderItem.unitPrice.toLocaleString()} {currency}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le retour
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}








