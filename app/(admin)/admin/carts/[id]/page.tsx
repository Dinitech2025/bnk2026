'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Users, Clock, ShoppingCart, Trash2, Package, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { toast } from 'sonner'
import Link from 'next/link'

interface CartItem {
  id: string
  type: string
  itemId: string
  name: string
  price: number
  quantity: number
  image?: string
  data?: any
  createdAt: string
}

interface Cart {
  id: string
  userId?: string
  sessionId?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name?: string
    email?: string
    image?: string
    phone?: string
    createdAt: string
  }
  items: CartItem[]
  total: number
  itemCount: number
}

export default function CartDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCart()
    }
  }, [params.id])

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/admin/carts/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Panier non trouvé')
          router.push('/admin/carts')
          return
        }
        throw new Error('Erreur lors de la récupération du panier')
      }
      const data = await response.json()
      setCart(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la récupération du panier')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!cart || !confirm('Êtes-vous sûr de vouloir supprimer ce panier ?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/carts/${cart.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast.success('Panier supprimé avec succès')
      router.push('/admin/carts')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression du panier')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Produit'
      case 'service': return 'Service'
      case 'offer': return 'Offre'
      default: return type
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'product': return 'default'
      case 'service': return 'secondary'
      case 'offer': return 'outline'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Panier non trouvé
        </h3>
        <p className="text-gray-500 mb-4">
          Le panier demandé n'existe pas ou a été supprimé.
        </p>
        <Button asChild>
          <Link href="/admin/carts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux paniers
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/carts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Détails du panier
            </h1>
            <p className="text-gray-600 mt-2">
              {cart.user ? `Panier de ${cart.user.name || cart.user.email}` : 'Panier de session invité'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {isExpired(cart.expiresAt) && (
            <Badge variant="destructive">Expiré</Badge>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations du panier */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client/Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {cart.user ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                <span>{cart.user ? 'Client' : 'Session invité'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={cart.user.image || ''} />
                      <AvatarFallback>
                        {cart.user.name?.charAt(0) || cart.user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{cart.user.name || 'Nom non défini'}</div>
                      {cart.user.name && cart.user.email && (
                        <div className="text-sm text-gray-500">{cart.user.email}</div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    {cart.user.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{cart.user.email}</span>
                      </div>
                    )}
                    {cart.user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{cart.user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Inscrit le {formatDate(cart.user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>Session ID: {cart.sessionId?.slice(0, 8)}...</span>
                  </div>
                  <p>Ce panier appartient à un utilisateur non connecté.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations temporelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Historique</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Créé le</div>
                <div className="text-gray-600">{formatDate(cart.createdAt)}</div>
              </div>
              <div>
                <div className="font-medium">Dernière modification</div>
                <div className="text-gray-600">{formatDate(cart.updatedAt)}</div>
              </div>
              <div>
                <div className="font-medium">Expire le</div>
                <div className={`${isExpired(cart.expiresAt) ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatDate(cart.expiresAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Articles</span>
                <span>{cart.itemCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span><PriceWithConversion price={cart.total} /></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles du panier */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Articles du panier ({cart.items.length})</span>
              </CardTitle>
              <CardDescription>
                Liste des articles ajoutés au panier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun article dans ce panier
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center space-x-4">
                        {item.image && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium truncate">{item.name}</h3>
                            <Badge variant={getTypeBadgeVariant(item.type)}>
                              {getTypeLabel(item.type)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Ajouté le {formatDate(item.createdAt)}</span>
                            <div className="flex items-center space-x-4">
                              <span>Quantité: {item.quantity}</span>
                              <span>Prix unitaire: <PriceWithConversion price={item.price} /></span>
                              <span className="font-medium">
                                Total: <PriceWithConversion price={item.price * item.quantity} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < cart.items.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 