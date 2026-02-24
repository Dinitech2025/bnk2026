'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Receipt, Truck, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { DeliveryNoteModal } from './delivery-note-modal'
import { InvoiceModal } from './invoice-modal'
// Composant de statut retiré - maintenant géré dans la page principale

interface OrderActionsProps {
  orderId: string
  orderStatus: string
  orderNumber?: string
  paymentStatus?: string
  hasPayments?: boolean
}

export function OrderActions({ 
  orderId, 
  orderStatus, 
  orderNumber, 
  paymentStatus, 
  hasPayments 
}: OrderActionsProps) {
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  // Fonction pour ouvrir le modal du bon de livraison
  const openDeliveryModal = () => {
    setDeliveryModalOpen(true)
  }

  // Fonction pour ouvrir le modal de facture/devis
  const openInvoiceModal = () => {
    setInvoiceModalOpen(true)
  }

  // Déterminer si la commande est payée
  const isPaid = paymentStatus === 'PAID' || hasPayments

  // Déterminer si la commande est livrée
  const isDelivered = ['DELIVERED', 'FINISHED'].includes(orderStatus)

  // Le bon de livraison n'est disponible que si la commande est livrée
  const canGenerateDeliveryNote = isDelivered

  // Le texte du bouton facture/devis selon le statut de paiement
  const invoiceButtonText = isPaid ? 'Facture' : 'Devis'
  const invoiceIcon = isPaid ? Receipt : FileText

  return (
    <div className="flex gap-2 flex-wrap">
        {canGenerateDeliveryNote && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={openDeliveryModal}
          >
            <Truck className="h-4 w-4" />
            Bon de livraison
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={openInvoiceModal}
        >
          {React.createElement(invoiceIcon, { className: "h-4 w-4" })}
          {invoiceButtonText}
        </Button>
      
      {/* Modal bon de livraison */}
      <DeliveryNoteModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
      />
      
      {/* Modal facture/devis */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
      />
    </div>
  )
}