'use client'

import React, { useState } from 'react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderStatusChangerProps {
  orderId: string
  currentStatus: string
  orderNumber?: string
  onStatusChange?: (newStatus: string) => void
}

// Définition des statuts avec leurs propriétés
const ORDER_STATUSES = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    icon: Clock,
    bgClass: 'bg-yellow-50 border-yellow-200'
  },
  PAID: {
    label: 'Payée',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: CheckCircle,
    bgClass: 'bg-green-50 border-green-200'
  },
  PROCESSING: {
    label: 'En cours',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    icon: Package,
    bgClass: 'bg-orange-50 border-orange-200'
  },
  SHIPPED: {
    label: 'Expédiée',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    icon: Truck,
    bgClass: 'bg-purple-50 border-purple-200'
  },
  DELIVERED: {
    label: 'Livrée',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: CheckCircle,
    bgClass: 'bg-green-50 border-green-200'
  },
  CANCELLED: {
    label: 'Annulée',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    icon: XCircle,
    bgClass: 'bg-red-50 border-red-200'
  }
} as const

type OrderStatus = keyof typeof ORDER_STATUSES

export function OrderStatusChanger({ 
  orderId, 
  currentStatus, 
  orderNumber,
  onStatusChange 
}: OrderStatusChangerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<OrderStatus>(currentStatus as OrderStatus)

  // Fonction pour changer le statut
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut')
      }

      setStatus(newStatus as OrderStatus)
      onStatusChange?.(newStatus)
      
      toast.success(`Statut mis à jour vers "${ORDER_STATUSES[newStatus as OrderStatus].label}"`, {
        description: orderNumber ? `Commande ${orderNumber}` : `Commande ${orderId.substring(0, 8)}`
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setIsLoading(false)
    }
  }

  const currentStatusInfo = ORDER_STATUSES[status] || ORDER_STATUSES.PENDING

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Statut:</span>
      
      <Select 
        value={status} 
        onValueChange={handleStatusChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentStatusInfo.color}`} />
              <span className={currentStatusInfo.textColor}>
                {currentStatusInfo.label}
              </span>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ORDER_STATUSES).map(([key, statusInfo]) => {
            const StatusIcon = statusInfo.icon
            return (
              <SelectItem 
                key={key} 
                value={key}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 py-1">
                  <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                  <StatusIcon className="h-4 w-4" />
                  <span className="font-medium">{statusInfo.label}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
