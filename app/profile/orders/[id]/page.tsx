'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, User, Phone, Mail, FileText, RotateCcw } from 'lucide-react'
import { translateOrderStatus, getOrderStatusColor } from '@/lib/utils/status-translations'
import { useCurrency } from '@/lib/contexts/currency-context'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  itemType: string
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
  metadata?: any
}

interface Address {
  id: string
  street: string
  city: string
  zipCode: string
  country: string
  type: string
}

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  shippingAddress?: Address
  billingAddress?: Address
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
  }
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const { currency, targetCurrency, exchangeRates } = useCurrency()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper pour convertir les prix (utilise les taux du système)
  const convertPrice = (price: number, targetCurrency?: string) => {
    if (!targetCurrency || targetCurrency === currency) return price
    
    // Utiliser les taux du système (exchangeRates du contexte)
    const rate = exchangeRates[targetCurrency]
    return rate ? price * rate : price
  }

  // Helper pour formater les prix avec conversion
  const formatPrice = (price: number) => {
    const convertedPrice = convertPrice(price, targetCurrency || currency)
    return `${convertedPrice.toLocaleString()} ${targetCurrency || currency}`
  }

  // Vérifier si un article peut être retourné
  const canReturnItem = (order: OrderDetail, item: OrderItem) => {
    // Conditions pour pouvoir retourner un article :
    // 1. Commande livrée
    // 2. Dans les 30 jours après livraison
    // 3. Pas déjà retourné
    
    if (order.status !== 'DELIVERED') return false
    
    const deliveryDate = new Date(order.createdAt) // Approximation, devrait être la date de livraison
    const returnDeadline = new Date(deliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    
    return new Date() <= returnDeadline
  }

  const handleReturnRequest = (item: OrderItem) => {
    // Rediriger vers la page de retours avec l'article pré-sélectionné
    router.push(`/returns?orderId=${order?.id}&itemId=${item.id}`)
  }

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile')
    }

    // Charger les détails de la commande
    if (status === 'authenticated' && session?.user?.id && orderId) {
      fetchOrderDetails()
    }
  }, [status, session, orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile/orders/${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Commande non trouvée')
        } else if (response.status === 403) {
          throw new Error('Vous n\'êtes pas autorisé à voir cette commande')
        }
        throw new Error('Impossible de charger les détails de la commande')
      }
      
      const data = await response.json()
      setOrder(data)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/profile?tab=orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à mes commandes
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  // Formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  // Obtenir le nom de l'article
  const getItemName = (item: OrderItem) => {
    if (item.product) return item.product.name
    if (item.service) return item.service.name
    if (item.offer) return item.offer.name
    
    // Vérifier les métadonnées pour les produits sans relation
    if (item.metadata) {
      try {
        const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
        if (metadata.name) return metadata.name
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
    
    return 'Article inconnu'
  }

  // Obtenir le type d'article
  const getItemType = (item: OrderItem) => {
    switch (item.itemType) {
      case 'PRODUCT':
        return 'Produit'
      case 'SERVICE':
        return 'Service'
      case 'OFFER':
        return 'Abonnement'
      default:
        return item.itemType
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/profile?tab=orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à mes commandes
        </Link>
      </div>

      {/* En-tête de la commande */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Commande {order.orderNumber}</h1>
            <p className="text-gray-600">
              Passée le {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Badge className={`px-3 py-1 text-sm ${getOrderStatusColor(order.status)}`}>
              {translateOrderStatus(order.status)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Détails de la commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles commandés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{getItemName(item)}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getItemType(item)} • Quantité: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Prix unitaire: {formatPrice(Number(item.unitPrice))}
                      </p>
                      
                      {/* Métadonnées spécifiques */}
                      {item.metadata && typeof item.metadata === 'object' && (
                        <div className="mt-2 text-xs text-gray-500">
                          {item.metadata.platform && (
                            <p>Plateforme: {item.metadata.platform.name}</p>
                          )}
                          {item.metadata.duration && (
                            <p>Durée: {item.metadata.duration}</p>
                          )}
                          {item.metadata.maxProfiles && (
                            <p>Profils: {item.metadata.maxProfiles}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-medium">{formatPrice(Number(item.totalPrice))}</p>
                      {order && canReturnItem(order, item) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturnRequest(item)}
                          className="text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retourner
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total</span>
                <span className="text-xl font-bold">{formatPrice(Number(order.total))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Informations de livraison */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{order.shippingAddress.type}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.zipCode} {order.shippingAddress.city}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adresse de facturation */}
          {order.billingAddress && order.billingAddress.id !== order.shippingAddress?.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Adresse de facturation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{order.billingAddress.type}</p>
                  <p>{order.billingAddress.street}</p>
                  <p>{order.billingAddress.zipCode} {order.billingAddress.city}</p>
                  <p>{order.billingAddress.country}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar avec informations complémentaires */}
        <div className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(order.user.firstName || order.user.lastName) && (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    {order.user.firstName} {order.user.lastName}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm">{order.user.email}</span>
              </div>
              {order.user.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{order.user.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails de la commande */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Détails de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Numéro de commande</p>
                <p className="text-sm text-gray-600">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Date de commande</p>
                <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Dernière mise à jour</p>
                <p className="text-sm text-gray-600">{formatDate(order.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Statut</p>
                <Badge className={`px-2 py-1 text-xs ${getOrderStatusColor(order.status)}`}>
                  {translateOrderStatus(order.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">
                  Contacter le support
                </Link>
              </Button>
              
              {order.status === 'Devis en attente de paiement' && (
                <Button className="w-full">
                  Procéder au paiement
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
