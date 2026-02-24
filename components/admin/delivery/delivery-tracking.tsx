'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Edit,
  Eye,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  status: string
  deliveryMethodId?: string
  shippingCost?: number
  estimatedDelivery?: any
  trackingNumber?: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  shippingAddress?: {
    street: string
    city: string
    zipCode: string
    country: string
  }
  deliveryMethod?: {
    name: string
    type: string
  }
  createdAt: string
}

interface DeliveryTrackingProps {
  isOpen: boolean
  onClose: () => void
}

export function DeliveryTracking({ isOpen, onClose }: DeliveryTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    status: 'SHIPPING',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadOrders()
    }
  }, [isOpen])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/orders?includeDelivery=true')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.filter((order: Order) => order.deliveryMethodId))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  const updateTracking = async (orderId: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Suivi mis à jour avec succès')
        loadOrders()
        setShowTrackingForm(false)
        setSelectedOrder(null)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'PAID': return 'bg-green-500'
      case 'CONFIRMED': return 'bg-green-500' // Ancienne valeur pour compatibilité
      case 'PROCESSING': return 'bg-purple-500'
      case 'SHIPPING': return 'bg-indigo-500'
      case 'DELIVERED': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente'
      case 'PAID': return 'Payée'
      case 'CONFIRMED': return 'Payée' // Ancienne valeur pour compatibilité
      case 'PROCESSING': return 'En préparation'
      case 'SHIPPING': return 'En livraison'
      case 'DELIVERED': return 'Livrée'
      case 'CANCELLED': return 'Annulée'
      default: return status
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Suivi des Livraisons
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtres */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par numéro de commande, client ou numéro de suivi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PAID">Payées</SelectItem>
                <SelectItem value="PROCESSING">En préparation</SelectItem>
                <SelectItem value="SHIPPING">En livraison</SelectItem>
                <SelectItem value="DELIVERED">Livrées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des commandes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Chargement...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune commande trouvée</h3>
              <p className="text-slate-600">Aucune commande avec livraison ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Package className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              Commande #{order.orderNumber}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-sm">
                            {order.user.firstName} {order.user.lastName}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {order.deliveryMethod?.name || 'Méthode non définie'}
                            </div>
                            {order.trackingNumber && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.trackingNumber}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setTrackingData({
                              trackingNumber: order.trackingNumber || '',
                              status: order.status,
                              notes: ''
                            })
                            setShowTrackingForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire de mise à jour du suivi */}
        {showTrackingForm && selectedOrder && (
          <Dialog open onOpenChange={() => setShowTrackingForm(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Mettre à jour le suivi - Commande #{selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Numéro de suivi</Label>
                  <Input
                    id="trackingNumber"
                    value={trackingData.trackingNumber}
                    onChange={(e) => setTrackingData(prev => ({
                      ...prev,
                      trackingNumber: e.target.value
                    }))}
                    placeholder="Ex: TRK123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={trackingData.status}
                    onValueChange={(value) => setTrackingData(prev => ({
                      ...prev,
                      status: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Payée</SelectItem>
                      <SelectItem value="PROCESSING">En préparation</SelectItem>
                      <SelectItem value="SHIPPING">En livraison</SelectItem>
                      <SelectItem value="DELIVERED">Livrée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={trackingData.notes}
                    onChange={(e) => setTrackingData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="Notes sur la livraison..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTrackingForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => updateTracking(selectedOrder.id, trackingData)}
                  >
                    Mettre à jour
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Détails de la commande */}
        {selectedOrder && !showTrackingForm && (
          <Dialog open onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Détails de la commande #{selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                    </p>
                    <p className="text-sm text-slate-600">{selectedOrder.user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Statut</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusLabel(selectedOrder.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.shippingAddress && (
                  <div>
                    <Label className="text-sm font-medium">Adresse de livraison</Label>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.shippingAddress.street}<br />
                      {selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.city}<br />
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Méthode de livraison</Label>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.deliveryMethod?.name || 'Non définie'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Frais de livraison</Label>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.shippingCost ? `${selectedOrder.shippingCost} Ar` : 'Non calculé'}
                    </p>
                  </div>
                </div>
                
                {selectedOrder.trackingNumber && (
                  <div>
                    <Label className="text-sm font-medium">Numéro de suivi</Label>
                    <p className="text-sm text-slate-600 font-mono">
                      {selectedOrder.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
