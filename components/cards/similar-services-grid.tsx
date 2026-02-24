'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Eye, Heart, Clock, MessageSquare } from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { toast } from '@/components/ui/use-toast'
import { useCart } from '@/lib/hooks/use-cart'
import { QuoteRequestForm } from '@/components/quotes/quote-request-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ServiceImage {
  url: string
  type: 'image' | 'video'
  alt?: string
}

interface ServiceCategory {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
  images: ServiceImage[]
  category: ServiceCategory
  pricingType?: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED'
}

interface SimilarServicesGridProps {
  categoryId: string
  currentServiceId: string
  title?: string
  maxItems?: number
}

export function SimilarServicesGrid({
  categoryId,
  currentServiceId,
  title = "Services similaires",
  maxItems = 4
}: SimilarServicesGridProps) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const { addToCart: addToCartAPI, isLoading: cartLoading } = useCart()

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  useEffect(() => {
    const fetchSimilarServices = async () => {
      try {
        const res = await fetch(`/api/public/services?category=${categoryId}`)
        if (!res.ok) throw new Error('Erreur lors du chargement')
        
        const allServices = await res.json()
        
        // Filtrer pour exclure le service actuel et limiter le nombre
        const similarServices = allServices
          .filter((service: Service) => service.id !== currentServiceId)
          .slice(0, maxItems)
        
        setServices(similarServices)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (categoryId && currentServiceId) {
      fetchSimilarServices()
    }
  }, [categoryId, currentServiceId, maxItems])

  const addToCart = async (service: Service) => {
    // Pour les services avec devis requis, ouvrir le modal
    if (service.pricingType === 'QUOTE_REQUIRED') {
      setSelectedService(service)
      setQuoteModalOpen(true)
      return
    }

    if (cartLoading) return

    try {
      const firstImage = service.images?.find(img => img.type === 'image')
      
      await addToCartAPI({
        type: 'service',
        itemId: service.id,
        name: service.name,
        price: Number(service.price),
        quantity: 1,
        image: firstImage?.url || service.images?.[0]?.url
      })
      
      toast({
        title: "Service ajouté!",
        description: `${service.name} ajouté à votre panier.`,
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le service au panier.",
        variant: "destructive",
      })
    }
  }

  const handleQuoteSuccess = (quoteId: string) => {
    setQuoteModalOpen(false)
    setSelectedService(null)
    toast({
      title: "Demande envoyée !",
      description: "Votre demande de devis a été transmise. Vous pouvez suivre son évolution dans votre profil.",
    })
  }

  const toggleFavorite = (serviceId: string) => {
    const newFavorites = favorites.includes(serviceId)
      ? favorites.filter(id => id !== serviceId)
      : [...favorites, serviceId]
    
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    
    toast({
      title: favorites.includes(serviceId) ? "Retiré des favoris" : "Ajouté aux favoris",
      description: "Vos favoris ont été mis à jour.",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: maxItems }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse border-0 shadow-md bg-white">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {services.map((service) => {
          const firstImage = service.images?.find(img => img.type === 'image')
          
          return (
            <Card key={service.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
              <CardHeader className="p-0 relative">
                <Link href={`/services/${service.id}`}>
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={firstImage?.url || '/placeholder-image.svg'}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Boutons overlay modernes */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-xl backdrop-blur-sm border-0 rounded-full"
                          asChild
                        >
                          <Link href={`/services/${service.id}`}>
                            <Eye className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.preventDefault()
                            addToCart(service)
                          }}
                          disabled={cartLoading}
                          className="h-10 w-10 p-0 shadow-xl border-0 rounded-full"
                        >
                          {service.pricingType === 'QUOTE_REQUIRED' ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <ShoppingCart className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleFavorite(service.id)
                          }}
                          className={`h-10 w-10 p-0 shadow-xl border-0 rounded-full ${
                            favorites.includes(service.id) 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-white/95 hover:bg-white text-gray-700'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${favorites.includes(service.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {service.category.name}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{service.duration} min</span>
                  </div>
                </div>
                <h3 className="font-medium text-sm mb-2 text-gray-900 line-clamp-2 leading-tight">
                  {service.name}
                </h3>
                <div className="text-base font-semibold text-primary">
                  {service.pricingType === 'QUOTE_REQUIRED' ? (
                    <span className="text-orange-600">Sur devis</span>
                  ) : (
                    <PriceWithConversion price={Number(service.price)} />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de demande de devis */}
      {selectedService && (
        <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Demande de devis</DialogTitle>
            </DialogHeader>
            <QuoteRequestForm
              service={selectedService}
              onSuccess={handleQuoteSuccess}
              onCancel={() => {
                setQuoteModalOpen(false)
                setSelectedService(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 