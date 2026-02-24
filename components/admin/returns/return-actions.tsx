'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle, RefreshCw, Truck, Package, CreditCard, Loader2, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReturnActionsProps {
  returnId: string
  currentStatus: string
}

const statusActions = [
  {
    status: 'APPROVED',
    label: 'Approuver',
    icon: CheckCircle,
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Approuver la demande de retour',
    availableFrom: ['REQUESTED']
  },
  {
    status: 'REJECTED',
    label: 'Rejeter',
    icon: XCircle,
    color: 'bg-red-600 hover:bg-red-700',
    description: 'Rejeter la demande de retour',
    availableFrom: ['REQUESTED', 'APPROVED']
  },
  {
    status: 'IN_TRANSIT',
    label: 'En transit',
    icon: Truck,
    color: 'bg-purple-600 hover:bg-purple-700',
    description: 'Marquer comme en transit vers nos locaux',
    availableFrom: ['APPROVED']
  },
  {
    status: 'RECEIVED',
    label: 'Reçu',
    icon: Package,
    color: 'bg-indigo-600 hover:bg-indigo-700',
    description: 'Marquer comme reçu dans nos locaux',
    availableFrom: ['IN_TRANSIT']
  },
  {
    status: 'PROCESSED',
    label: 'Traité',
    icon: RefreshCw,
    color: 'bg-orange-600 hover:bg-orange-700',
    description: 'Marquer comme traité et vérifié',
    availableFrom: ['RECEIVED']
  },
  {
    status: 'REFUNDED',
    label: 'Remboursé',
    icon: CreditCard,
    color: 'bg-green-600 hover:bg-green-700',
    description: 'Marquer comme remboursé au client',
    availableFrom: ['PROCESSED']
  }
]

const refundMethods = [
  { value: 'original_payment', label: 'Méthode de paiement originale' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'store_credit', label: 'Crédit boutique' },
  { value: 'cash', label: 'Espèces' }
]

export function ReturnActions({ returnId, currentStatus }: ReturnActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    approvedAmount: '',
    refundedAmount: '',
    refundMethod: '',
    trackingNumber: '',
    adminNotes: ''
  })

  const availableActions = statusActions.filter(action => 
    action.availableFrom.includes(currentStatus)
  )

  const handleActionSelect = (status: string) => {
    setSelectedAction(status)
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedAction) return

    setIsSubmitting(true)
    try {
      const payload: any = {
        status: selectedAction,
        adminNotes: formData.adminNotes || undefined
      }

      // Ajouter des champs spécifiques selon l'action
      if (selectedAction === 'APPROVED' && formData.approvedAmount) {
        payload.approvedAmount = parseFloat(formData.approvedAmount)
      }

      if (selectedAction === 'IN_TRANSIT' && formData.trackingNumber) {
        payload.trackingNumber = formData.trackingNumber
      }

      if (selectedAction === 'REFUNDED') {
        if (formData.refundedAmount) {
          payload.refundedAmount = parseFloat(formData.refundedAmount)
        }
        if (formData.refundMethod) {
          payload.refundMethod = formData.refundMethod
        }
      }

      const response = await fetch(`/api/admin/returns/${returnId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      const result = await response.json()
      
      toast({
        title: "Statut mis à jour",
        description: `Le retour a été marqué comme "${result.return.status}"`,
      })

      // Réinitialiser le formulaire
      setFormData({
        approvedAmount: '',
        refundedAmount: '',
        refundMethod: '',
        trackingNumber: '',
        adminNotes: ''
      })
      setIsOpen(false)
      setSelectedAction(null)

      // Rafraîchir la page
      router.refresh()

    } catch (error: any) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionForm = () => {
    if (!selectedAction) return null

    const action = statusActions.find(a => a.status === selectedAction)
    if (!action) return null

    return (
      <div className="space-y-4">
        {/* Montant approuvé */}
        {selectedAction === 'APPROVED' && (
          <div className="space-y-2">
            <Label htmlFor="approvedAmount">Montant approuvé (optionnel)</Label>
            <Input
              id="approvedAmount"
              type="number"
              placeholder="Laisser vide pour garder le montant demandé"
              value={formData.approvedAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, approvedAmount: e.target.value }))}
            />
          </div>
        )}

        {/* Numéro de suivi */}
        {selectedAction === 'IN_TRANSIT' && (
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Numéro de suivi</Label>
            <Input
              id="trackingNumber"
              placeholder="Numéro de suivi du colis"
              value={formData.trackingNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
            />
          </div>
        )}

        {/* Remboursement */}
        {selectedAction === 'REFUNDED' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="refundedAmount">Montant remboursé</Label>
              <Input
                id="refundedAmount"
                type="number"
                placeholder="Montant effectivement remboursé"
                value={formData.refundedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, refundedAmount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundMethod">Méthode de remboursement</Label>
              <Select 
                value={formData.refundMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, refundMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la méthode" />
                </SelectTrigger>
                <SelectContent>
                  {refundMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Notes administratives */}
        <div className="space-y-2">
          <Label htmlFor="adminNotes">Notes administratives</Label>
          <Textarea
            id="adminNotes"
            placeholder="Ajouter des notes sur cette action..."
            value={formData.adminNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
            rows={3}
          />
        </div>
      </div>
    )
  }

  if (availableActions.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {availableActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Button
              key={action.status}
              onClick={() => handleActionSelect(action.status)}
              className={`text-white ${action.color}`}
              size="sm"
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAction && statusActions.find(a => a.status === selectedAction)?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedAction && statusActions.find(a => a.status === selectedAction)?.description}
            </DialogDescription>
          </DialogHeader>

          {getActionForm()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={selectedAction ? statusActions.find(a => a.status === selectedAction)?.color : ''}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}








