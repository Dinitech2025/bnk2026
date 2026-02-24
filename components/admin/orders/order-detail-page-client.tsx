'use client'

import React, { useState } from 'react'
import { OrderDetailClient } from './order-detail-client'
import { PaymentModal } from './payment-modal'

interface OrderDetailPageClientProps {
  orderId: string
  currentStatus: string
  orderNumber?: string
  orderTotal: number
  currency: string
  onStatusChange?: (newStatus: string) => void
  onPaymentSuccess?: () => void
}

export function OrderDetailPageClient({ 
  orderId, 
  currentStatus, 
  orderNumber,
  orderTotal,
  currency,
  onStatusChange,
  onPaymentSuccess
}: OrderDetailPageClientProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
  }

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false)
    // Appeler le callback parent pour rafraîchir
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
  }

  return (
    <>
      <OrderDetailClient
        orderId={orderId}
        currentStatus={currentStatus}
        orderNumber={orderNumber}
        onOpenPaymentModal={handleOpenPaymentModal}
        onStatusChange={onStatusChange}
      />
      
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        orderId={orderId}
        orderTotal={orderTotal}
        currency={currency}
        orderNumber={orderNumber || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  )
}
