'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, ShoppingBag, User, Users, Clock, CheckCircle, Package, Tag, Star, Truck, Shield, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useCart } from '@/lib/hooks/use-cart'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  currency: string
  type?: string
  platform?: {
    id: string
    name: string
    logo: string | null
  }
  duration?: string
  maxProfiles?: number
  reservation?: {
    offerId: string
    account: {
      id: string
      available: boolean
    }
    profiles: Array<{
      id: string
      reserved: boolean
    }>
    reservedAt: string
    autoSelected?: boolean
  }
}

export default function CartPage() {
  const { cart, items, isLoading, updateQuantity, removeFromCart, clearCart } = useCart()
  const [itemDetails, setItemDetails] = useState<Record<string, any>>({})
  
  // Fonction pour détecter si un item est un abonnement
  const isSubscription = (item: any) => {
    return item.type === 'offer' && (item.data?.platform || item.data?.reservation)
  }

  // Récupérer les détails supplémentaires des items
  useEffect(() => {
    const fetchItemDetails = async () => {
      const details: Record<string, any> = {}
      
      for (const item of items) {
        try {
          if (item.type === 'product') {
            const response = await fetch(`/api/public/products?id=${item.itemId}`)
            if (response.ok) {
              const data = await response.json()
              const product = data.find((p: any) => p.id === item.itemId)
              if (product) {
                                 details[item.id] = {
                   category: product.category?.name,
                   sku: product.sku,
                   inventory: product.inventory,
                   weight: product.weight,
                   compareAtPrice: product.compareAtPrice,
                   featured: product.featured,
                   mainImage: product.images?.[0]?.url
                 }
              }
            }
          } else if (item.type === 'service') {
            const response = await fetch(`/api/public/services?id=${item.itemId}`)
            if (response.ok) {
              const data = await response.json()
              const service = data.find((s: any) => s.id === item.itemId)
              if (service) {
                                 details[item.id] = {
                   category: service.category?.name,
                   duration: service.duration,
                   description: service.description,
                   mainImage: service.images?.[0]?.url
                 }
              }
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails pour ${item.id}:`, error)
        }
      }
      
      setItemDetails(details)
    }

    if (items.length > 0) {
      fetchItemDetails()
    }
  }, [items])

  // Fonction pour formater la durée des services
  const formatServiceDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    } else if (minutes === 60) {
      return '1 heure'
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} heure${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(minutes / 1440)
      return `${days} jour${days > 1 ? 's' : ''}`
    }
  }

  // Fonction pour déterminer le statut de stock
  const getStockStatus = (inventory: number) => {
    if (inventory === 0) return { status: 'rupture', color: 'bg-red-100 text-red-700', label: 'Rupture de stock' }
    if (inventory <= 5) return { status: 'faible', color: 'bg-yellow-100 text-yellow-700', label: 'Stock faible' }
    if (inventory <= 20) return { status: 'limite', color: 'bg-orange-100 text-orange-700', label: 'Stock limité' }
    return { status: 'disponible', color: 'bg-green-100 text-green-700', label: 'En stock' }
  }

  // Adapter les items du nouveau format vers l'ancien pour la compatibilité
  const cartItems = items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    currency: 'Ar',
    type: isSubscription(item) ? 'subscription' : item.type,
    // Les données spécifiques aux abonnements sont dans item.data
    platform: item.data?.platform,
    duration: item.data?.duration,
    maxProfiles: item.data?.maxProfiles,
    reservation: item.data?.reservation
  }))

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId)
      return
    }
    
    // Pour les abonnements, ne pas permettre de changer la quantité
    const item = cartItems.find(item => item.id === itemId)
    if (item?.type === 'subscription') {
      return
    }
    
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const getTotalPrice = () => {
    return cart?.total || 0
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error)
    }
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return
    }

    // Préparer les données de commande
    const orderData = {
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        type: item.type,
        platform: item.platform,
        duration: item.duration,
        maxProfiles: item.maxProfiles,
        reservation: item.reservation
      })),
      total: getTotalPrice(),
      currency: 'Ar',
      timestamp: new Date().toISOString()
    }

    // Sauvegarder la commande dans localStorage pour la page de checkout
    localStorage.setItem('pendingOrder', JSON.stringify(orderData))
    
    // Rediriger vers la page de checkout
    window.location.href = '/checkout'
  }

  const formatReservationTime = (reservedAt: string) => {
    const date = new Date(reservedAt)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement du panier...</div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400" />
          <h1 className="text-2xl font-bold">Votre panier est vide</h1>
          <p className="text-gray-600">Ajoutez des produits pour commencer vos achats</p>
          <div className="flex justify-center space-x-4">
            <Link href="/products">
              <Button>Voir nos produits</Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline">Voir les abonnements</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Liste des articles */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Mon panier ({cartItems.length} articles)</h1>
            <Button variant="outline" onClick={handleClearCart} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le panier
            </Button>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className={item.type === 'subscription' ? 'border-blue-200 bg-blue-50/30' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    {/* Image principale selon le type d'article */}
                    {item.type === 'subscription' && item.platform?.logo ? (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={item.platform.logo}
                          alt={item.platform.name}
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (itemDetails[item.id]?.mainImage || item.image) ? (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={itemDetails[item.id]?.mainImage || item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="relative h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg border flex items-center justify-center">
                        {item.type === 'product' && <Package className="h-6 w-6 text-gray-400" />}
                        {item.type === 'service' && <Star className="h-6 w-6 text-gray-400" />}
                        {!item.type && <ShoppingBag className="h-6 w-6 text-gray-400" />}
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      {/* En-tête avec nom et badges */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{item.name}</h3>
                          
                          {/* Badges et informations selon le type */}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {item.type === 'subscription' && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                🎮 Abonnement
                              </Badge>
                            )}
                            {item.type === 'product' && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                Produit
                              </Badge>
                            )}
                            {item.type === 'service' && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                <Star className="h-3 w-3 mr-1" />
                                Service
                              </Badge>
                            )}
                            
                            {/* Badge catégorie */}
                            {itemDetails[item.id]?.category && (
                              <Badge variant="outline" className="text-xs text-gray-600">
                                <Tag className="h-3 w-3 mr-1" />
                                {itemDetails[item.id].category}
                              </Badge>
                            )}
                            
                            {/* Badge produit vedette */}
                            {itemDetails[item.id]?.featured && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-700">
                                ⭐ Vedette
                              </Badge>
                            )}
                            
                            {/* Informations produit sur la même ligne */}
                            {item.type === 'product' && itemDetails[item.id] && (
                              <>
                                {/* SKU */}
                                {itemDetails[item.id].sku && (
                                  <span className="flex items-center text-xs text-gray-600">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {itemDetails[item.id].sku}
                                  </span>
                                )}
                                
                                {/* Poids */}
                                {itemDetails[item.id].weight && (
                                  <span className="flex items-center text-xs text-gray-600">
                                    <Truck className="h-3 w-3 mr-1" />
                                    {itemDetails[item.id].weight} kg
                                  </span>
                                )}
                                
                                {/* Statut de stock */}
                                {typeof itemDetails[item.id].inventory === 'number' && (
                                  <Badge className={`text-xs ${getStockStatus(itemDetails[item.id].inventory).color}`}>
                                    {getStockStatus(itemDetails[item.id].inventory).label}
                                  </Badge>
                                )}
                              </>
                            )}
                            
                            {/* Informations service sur la même ligne */}
                            {item.type === 'service' && itemDetails[item.id] && (
                              <>
                                {/* Durée du service */}
                                {itemDetails[item.id].duration && (
                                  <span className="flex items-center text-xs text-gray-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatServiceDuration(itemDetails[item.id].duration)}
                                  </span>
                                )}
                                
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Pro
                                </Badge>
                              </>
                            )}
                            
                            {/* Informations abonnement sur la même ligne */}
                            {item.type === 'subscription' && (
                              <>
                                {/* Durée de l'abonnement */}
                                {item.duration && (
                                  <span className="flex items-center text-xs text-gray-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {item.duration}
                                  </span>
                                )}
                                
                                {/* Nombre de profils */}
                                {item.maxProfiles && (
                                  <span className="flex items-center text-xs text-gray-600">
                                    <Users className="h-3 w-3 mr-1" />
                                    {item.maxProfiles} profil{item.maxProfiles > 1 ? 's' : ''}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prix comparé pour les produits */}
                      {item.type === 'product' && itemDetails[item.id] && itemDetails[item.id].compareAtPrice && itemDetails[item.id].compareAtPrice > item.price && (
                        <div className="text-xs text-gray-500">
                          <span className="line-through">
                            <PriceWithConversion price={itemDetails[item.id].compareAtPrice} />
                          </span>
                          <span className="ml-2 text-green-600 font-medium">
                            -<PriceWithConversion price={itemDetails[item.id].compareAtPrice - item.price} />
                          </span>
                        </div>
                      )}



                      {/* Réservation des ABONNEMENTS */}
                      {item.type === 'subscription' && item.reservation && (
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-blue-600" />
                              <span className="font-medium text-xs text-blue-800">Réservé</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-700">Disponible</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>{formatReservationTime(item.reservation.reservedAt)}</span>
                            {item.reservation.autoSelected && (
                              <span className="flex items-center text-purple-600">
                                <Star className="h-3 w-3 mr-1" />
                                Auto
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prix avec informations détaillées */}
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-base">
                              <PriceWithConversion price={item.price} />
                              {item.type === 'subscription' && item.duration && (
                                <span className="text-xs text-gray-500 font-normal"> / {item.duration}</span>
                              )}
                            </p>
                            {item.type === 'product' && item.quantity > 1 && (
                              <p className="text-xs text-gray-500">
                                <PriceWithConversion price={item.price} /> × {item.quantity}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contrôles de quantité (seulement pour les produits normaux) */}
                    {item.type !== 'subscription' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="font-medium">
                        <PriceWithConversion price={item.price * item.quantity} />
                      </p>
                      {item.type === 'subscription' && (
                        <p className="text-xs text-gray-500">Quantité: 1</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Résumé de la commande */}
        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <span>Résumé de la commande</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Détails des articles */}
              <div className="space-y-2 text-sm">
                {cartItems.filter(item => item.type === 'product').length > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      Produits ({cartItems.filter(item => item.type === 'product').length})
                    </span>
                    <span>
                      <PriceWithConversion 
                        price={cartItems
                          .filter(item => item.type === 'product')
                          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        } 
                      />
                    </span>
                  </div>
                )}
                
                {cartItems.filter(item => item.type === 'service').length > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      Services ({cartItems.filter(item => item.type === 'service').length})
                    </span>
                    <span>
                      <PriceWithConversion 
                        price={cartItems
                          .filter(item => item.type === 'service')
                          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        } 
                      />
                    </span>
                  </div>
                )}
                
                {cartItems.filter(item => item.type === 'subscription').length > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center text-blue-600">
                      <Users className="h-4 w-4 mr-1" />
                      Abonnements ({cartItems.filter(item => item.type === 'subscription').length})
                    </span>
                    <span className="text-blue-600">
                      <PriceWithConversion 
                        price={cartItems
                          .filter(item => item.type === 'subscription')
                          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        } 
                      />
                    </span>
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span><PriceWithConversion price={getTotalPrice()} /></span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Truck className="h-4 w-4 mr-1" />
                  Livraison
                </span>
                <span className="text-green-600 font-medium">Gratuite</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span><PriceWithConversion price={getTotalPrice()} /></span>
              </div>
              
              {/* Statistiques du panier */}
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                <div className="font-medium text-gray-700">📊 Détails du panier:</div>
                <div className="text-gray-600">
                  • {cartItems.reduce((sum, item) => sum + item.quantity, 0)} article{cartItems.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''} au total
                </div>
                {cartItems.some(item => item.type === 'subscription') && (
                  <div className="text-blue-600">
                    • {cartItems.filter(item => item.type === 'subscription').reduce((sum, item) => sum + (item.maxProfiles || 0), 0)} profil{cartItems.filter(item => item.type === 'subscription').reduce((sum, item) => sum + (item.maxProfiles || 0), 0) > 1 ? 's' : ''} de streaming réservé{cartItems.filter(item => item.type === 'subscription').reduce((sum, item) => sum + (item.maxProfiles || 0), 0) > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              {/* Notes importantes */}
              {cartItems.some(item => item.type === 'subscription') && (
                <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-200">
                  <p className="font-medium mb-1 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    🔒 Abonnements sécurisés
                  </p>
                  <p>Les comptes et profils sont réservés temporairement. Attribution définitive après paiement confirmé.</p>
                </div>
              )}

              {/* Informations de livraison pour produits */}
              {cartItems.some(item => item.type === 'product') && (
                <div className="bg-green-50 p-3 rounded text-xs text-green-700 border border-green-200">
                  <p className="font-medium mb-1 flex items-center">
                    <Truck className="h-3 w-3 mr-1" />
                    🚚 Livraison gratuite
                  </p>
                  <p>Livraison gratuite pour toute commande. Délai standard: 2-3 jours ouvrés.</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  <Shield className="h-4 w-4 mr-2" />
                  Passer la commande sécurisée
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/products" className="block">
                    <Button variant="outline" className="w-full text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      Produits
                    </Button>
                  </Link>
                  <Link href="/subscriptions" className="block">
                    <Button variant="outline" className="w-full text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Abonnements
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 