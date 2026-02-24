'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Trash2, Clock, DollarSign, Tag, Users, Calendar } from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { toast } from '@/components/ui/use-toast'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  images: { url: string }[]
  category: {
    id: string
    name: string
  }
  pricingType: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED'
  minPrice?: number
  maxPrice?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    orders: number
  }
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string

  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/services/${serviceId}`)
      
      if (!response.ok) {
        throw new Error('Service non trouvé')
      }
      
      const data = await response.json()
      setService(data)
    } catch (error) {
      console.error('Erreur lors du chargement du service:', error)
      setError('Impossible de charger le service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!service) return
    
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast({
        title: "Service supprimé",
        description: `Le service "${service.name}" a été supprimé avec succès.`,
      })

      router.push('/admin/services')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le service.",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPricingDisplay = (service: Service) => {
    switch (service.pricingType) {
      case 'FIXED':
        return <PriceWithConversion price={service.price} />
      case 'NEGOTIABLE':
        return <span className="text-blue-600">Prix négociable</span>
      case 'RANGE':
        return (
          <span>
            <PriceWithConversion price={service.minPrice || 0} /> - <PriceWithConversion price={service.maxPrice || 0} />
          </span>
        )
      case 'QUOTE_REQUIRED':
        return <span className="text-purple-600">Devis requis</span>
      default:
        return <PriceWithConversion price={service.price} />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service non trouvé</h1>
          <p className="text-gray-600 mb-4">{error || 'Le service demandé n\'existe pas.'}</p>
          <Button onClick={() => router.push('/admin/services')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux services
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/services')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-600">Détails du service</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? 'Actif' : 'Inactif'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/services/${serviceId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
            </CardHeader>
            <CardContent>
              {service.images && service.images.length > 0 ? (
                <img
                  src={service.images[0].url}
                  alt={service.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Aucune image</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {service.description || 'Aucune description disponible.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Prix</p>
                  <p className="font-semibold">{getPricingDisplay(service)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="font-semibold">{service.duration} minutes</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Catégorie</p>
                  <p className="font-semibold">{service.category.name}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Commandes</p>
                  <p className="font-semibold">{service._count.orders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Créé le</p>
                  <p className="font-semibold text-sm">{formatDate(service.createdAt)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Modifié le</p>
                  <p className="font-semibold text-sm">{formatDate(service.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/services/${service.id}`, '_blank')}
              >
                Voir sur le site
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/services/${serviceId}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 