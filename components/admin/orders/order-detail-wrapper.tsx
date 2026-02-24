'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OrderDetailPageClient } from './order-detail-page-client'
import { toast } from 'sonner'

interface OrderDetailWrapperProps {
  orderId: string
  initialStatus: string
  orderNumber?: string
  orderTotal: number
  currency: string
}

export function OrderDetailWrapper({ 
  orderId, 
  initialStatus, 
  orderNumber,
  orderTotal,
  currency
}: OrderDetailWrapperProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setIsUpdating(true)
    
    try {
      // Attendre un peu pour que l'API se mette à jour
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Rafraîchir les données de la page
      router.refresh()
      
      // Notification de succès
      toast.success(`Statut mis à jour vers "${getStatusLabel(newStatus)}"`)
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setIsUpdating(false)
    }
  }, [router])

  const handlePaymentSuccess = useCallback(() => {
    setIsUpdating(true)
    
    // Rafraîchir après un paiement réussi
    setTimeout(() => {
      router.refresh()
      setIsUpdating(false)
      toast.success('Paiement enregistré avec succès')
    }, 1000)
  }, [router])

  return (
    <div className={isUpdating ? 'opacity-75 pointer-events-none' : ''}>
      <OrderDetailPageClient
        orderId={orderId}
        currentStatus={initialStatus}
        orderNumber={orderNumber}
        orderTotal={orderTotal}
        currency={currency}
        onStatusChange={handleStatusChange}
        onPaymentSuccess={handlePaymentSuccess}
      />
      
      {isUpdating && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Mise à jour en cours...
          </div>
        </div>
      )}
    </div>
  )
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'PENDING': 'En attente',
    'PARTIALLY_PAID': 'Payée partiellement',
    'PAID': 'Payée',
    'PROCESSING': 'En cours',
    'SHIPPED': 'Expédiée',
    'DELIVERED': 'Livrée',
    'CANCELLED': 'Annulée',
    'REFUNDED': 'Remboursée'
  }
  return labels[status] || status
}
