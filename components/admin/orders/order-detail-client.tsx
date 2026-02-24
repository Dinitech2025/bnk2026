'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressStatusBar } from './progress-status-bar'

interface OrderDetailClientProps {
  orderId: string
  currentStatus: string
  orderNumber?: string
  onOpenPaymentModal?: () => void
  onStatusChange?: (newStatus: string) => void
}

export function OrderDetailClient({ 
  orderId, 
  currentStatus, 
  orderNumber,
  onOpenPaymentModal,
  onStatusChange: parentOnStatusChange
}: OrderDetailClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)

  // Synchroniser l'état local avec le statut de la page
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  const handleStatusChange = (newStatus: string) => {
    // Mise à jour optimiste de l'état local
    setStatus(newStatus)
    
    // Appeler le callback parent si disponible, sinon utiliser router.refresh()
    if (parentOnStatusChange) {
      parentOnStatusChange(newStatus)
    } else {
      // Fallback: rafraîchir les données de la page sans rechargement complet
      setTimeout(() => {
        router.refresh()
      }, 500)
    }
  }

  return (
    <ProgressStatusBar
      orderId={orderId}
      currentStatus={status}
      orderNumber={orderNumber}
      onStatusChange={handleStatusChange}
      onOpenPaymentModal={onOpenPaymentModal}
    />
  )
}
