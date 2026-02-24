'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Search,
  Calendar,
  User,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface TrackingInfo {
  orderNumber: string
  status: string
  trackingNumber?: string
  estimatedDelivery?: any
  shippingCost?: number
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
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  createdAt: string
  updatedAt: string
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber.trim() || !email.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    setNotFound(false)
    setTrackingInfo(null)

    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTrackingInfo(data)
      } else if (response.status === 404) {
        setNotFound(true)
      } else {
        toast.error('Erreur lors de la recherche de la commande')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la recherche de la commande')
    } finally {
      setLoading(false)
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

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: 'PAID', label: 'Payée', icon: CheckCircle },
      { key: 'PROCESSING', label: 'En préparation', icon: Package },
      { key: 'SHIPPING', label: 'En livraison', icon: Truck },
      { key: 'DELIVERED', label: 'Livrée', icon: CheckCircle }
    ]

    const statusOrder = ['PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentStatus)

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: step.key === currentStatus
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Suivre ma commande
          </h1>
          <p className="text-gray-600">
            Entrez votre numéro de commande et votre email pour suivre votre livraison
          </p>
        </div>

        {/* Formulaire de recherche */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher votre commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Numéro de commande *</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ex: CMD-2025-0001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Recherche...' : 'Suivre ma commande'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Commande non trouvée */}
        {notFound && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <Package className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Commande non trouvée
              </h3>
              <p className="text-red-600">
                Aucune commande ne correspond au numéro et à l'email fournis.
                Vérifiez vos informations et réessayez.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informations de suivi */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* En-tête de la commande */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Commande #{trackingInfo.orderNumber}
                    </h2>
                    <p className="text-gray-600">
                      Commandée le {new Date(trackingInfo.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(trackingInfo.status)} size="lg">
                    {getStatusLabel(trackingInfo.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {trackingInfo.user.firstName} {trackingInfo.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{trackingInfo.user.email}</p>
                    </div>
                  </div>

                  {trackingInfo.deliveryMethod && (
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{trackingInfo.deliveryMethod.name}</p>
                        <p className="text-sm text-gray-600">
                          {trackingInfo.shippingCost ? `${trackingInfo.shippingCost} Ar` : 'Gratuit'}
                        </p>
                      </div>
                    </div>
                  )}

                  {trackingInfo.trackingNumber && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Numéro de suivi</p>
                        <p className="text-sm text-gray-600 font-mono">
                          {trackingInfo.trackingNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progression de la livraison */}
            <Card>
              <CardHeader>
                <CardTitle>Statut de la livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getStatusSteps(trackingInfo.status).map((step, index) => {
                    const Icon = step.icon
                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          step.completed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            step.current ? 'text-blue-600' : 
                            step.completed ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                          {step.current && (
                            <p className="text-sm text-gray-600">
                              Dernière mise à jour: {new Date(trackingInfo.updatedAt).toLocaleString('fr-FR')}
                            </p>
                          )}
                        </div>
                        {step.completed && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            {trackingInfo.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900">
                    {trackingInfo.shippingAddress.street}<br />
                    {trackingInfo.shippingAddress.zipCode} {trackingInfo.shippingAddress.city}<br />
                    {trackingInfo.shippingAddress.country}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Articles commandés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles commandés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingInfo.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{(item.price * item.quantity).toLocaleString()} Ar</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
