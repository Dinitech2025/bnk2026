'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RotateCcw, 
  Plus, 
  Eye, 
  Package,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import { ReturnRequestModal } from '@/components/returns/return-request-modal'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ReturnRequest {
  id: string
  returnNumber: string
  status: string
  reason: string
  description?: string
  requestedAmount: number
  approvedAmount?: number
  refundedAmount?: number
  createdAt: string
  order: {
    orderNumber: string
    total: number
  }
  returnItems: Array<{
    quantity: number
    refundAmount: number
    orderItem: {
      name: string
      product?: { name: string }
      service?: { name: string }
    }
  }>
}

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

export default function ReturnsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Récupérer les paramètres d'URL pour pré-sélectionner une commande/article
  const preSelectedOrderId = searchParams.get('orderId')
  const preSelectedItemId = searchParams.get('itemId')

  useEffect(() => {
    if (session?.user) {
      loadReturns()
      loadEligibleOrders()
    }
  }, [session])

  // Ouvrir automatiquement le modal si une commande est pré-sélectionnée
  useEffect(() => {
    if (preSelectedOrderId && eligibleOrders.length > 0) {
      const order = eligibleOrders.find(o => o.id === preSelectedOrderId)
      if (order) {
        setSelectedOrder(order)
        setShowRequestModal(true)
      }
    }
  }, [preSelectedOrderId, eligibleOrders])

  const loadReturns = async () => {
    try {
      const response = await fetch('/api/returns')
      if (response.ok) {
        const data = await response.json()
        setReturns(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des retours:', error)
    }
  }

  const loadEligibleOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/orders')
      if (response.ok) {
        const orders = await response.json()
        // Filtrer les commandes éligibles au retour (livrées, dans les 30 jours)
        const eligible = orders.filter((order: Order) => {
          const deliveryDate = new Date(order.createdAt) // Approximation
          const returnDeadline = new Date(deliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          const hasExistingReturn = returns.some(r => r.order.orderNumber === order.orderNumber)
          
          return order.status === 'DELIVERED' && 
                 new Date() <= returnDeadline && 
                 !hasExistingReturn
        })
        setEligibleOrders(eligible)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnCreated = (newReturn: ReturnRequest) => {
    setReturns(prev => [newReturn, ...prev])
    setShowRequestModal(false)
    setSelectedOrder(null)
    toast.success('Demande de retour créée avec succès')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-500'
      case 'APPROVED': return 'bg-blue-500'
      case 'REJECTED': return 'bg-red-500'
      case 'IN_TRANSIT': return 'bg-purple-500'
      case 'RECEIVED': return 'bg-indigo-500'
      case 'PROCESSED': return 'bg-orange-500'
      case 'REFUNDED': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'Demandé'
      case 'APPROVED': return 'Approuvé'
      case 'REJECTED': return 'Rejeté'
      case 'IN_TRANSIT': return 'En transit'
      case 'RECEIVED': return 'Reçu'
      case 'PROCESSED': return 'Traité'
      case 'REFUNDED': return 'Remboursé'
      default: return status
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE': return 'Défectueux'
      case 'WRONG_ITEM': return 'Mauvais article'
      case 'NOT_AS_DESCRIBED': return 'Non conforme'
      case 'CHANGED_MIND': return 'Changement d\'avis'
      case 'DAMAGED_SHIPPING': return 'Endommagé pendant le transport'
      case 'SIZE_ISSUE': return 'Problème de taille'
      case 'QUALITY_ISSUE': return 'Problème de qualité'
      default: return reason
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Mes Retours
            </h1>
            <p className="text-gray-600 mb-8">
              Vous devez être connecté pour voir vos demandes de retour
            </p>
            <Link href="/auth/signin">
              <Button>Se connecter</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mes Retours
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos demandes de retour et remboursements
            </p>
          </div>
          {eligibleOrders.length > 0 && (
            <Button 
              onClick={() => setShowRequestModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Commandes éligibles */}
            {eligibleOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Commandes éligibles au retour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eligibleOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Commande #{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {order.items.length} articles • {order.total.toLocaleString()} Ar
                          </p>
                          <p className="text-xs text-gray-500">
                            Commandée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowRequestModal(true)
                          }}
                        >
                          Demander un retour
                        </Button>
                      </div>
                    ))}
                    {eligibleOrders.length > 3 && (
                      <p className="text-sm text-gray-600 text-center pt-2">
                        +{eligibleOrders.length - 3} autres commandes éligibles
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mes demandes de retour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Mes demandes de retour
                </CardTitle>
              </CardHeader>
              <CardContent>
                {returns.length === 0 ? (
                  <div className="text-center py-12">
                    <RotateCcw className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Aucune demande de retour
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Vous n'avez pas encore fait de demande de retour
                    </p>
                    {eligibleOrders.length > 0 && (
                      <Button 
                        onClick={() => setShowRequestModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Première demande
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {returns.map((returnRequest) => (
                      <div key={returnRequest.id} className="border rounded-lg p-6 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <RotateCcw className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900">
                                  #{returnRequest.returnNumber}
                                </h3>
                                <Badge className={getStatusColor(returnRequest.status)}>
                                  {getStatusLabel(returnRequest.status)}
                                </Badge>
                              </div>
                              <p className="text-slate-600 text-sm">
                                Commande #{returnRequest.order.orderNumber}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {getReasonLabel(returnRequest.reason)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {(returnRequest.refundedAmount || returnRequest.approvedAmount || returnRequest.requestedAmount).toLocaleString()} Ar
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {returnRequest.returnItems.length} article(s)
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(returnRequest.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Ouvrir modal de détails
                                toast.info('Détails du retour - À implémenter')
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de demande de retour */}
        {showRequestModal && (
          <ReturnRequestModal
            eligibleOrders={eligibleOrders}
            selectedOrder={selectedOrder}
            preSelectedItemId={preSelectedItemId}
            onClose={() => {
              setShowRequestModal(false)
              setSelectedOrder(null)
            }}
            onReturnCreated={handleReturnCreated}
          />
        )}
      </div>
    </div>
  )
}