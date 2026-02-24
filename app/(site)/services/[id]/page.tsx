'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ArrowLeft, Clock, Play, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { SimilarServicesGrid } from '@/components/cards/similar-services-grid'
import { ServicePricingSelectorSimple } from '@/components/services/service-pricing-selector-simple'
import { QuoteRequestForm } from '@/components/quotes/quote-request-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface ServiceMedia {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  thumbnail?: string; // Pour les vidéos
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  duration: number;
  images: ServiceMedia[]; // Maintenant ça peut être des images ou vidéos
  category: ServiceCategory;
  // Nouveaux champs de pricing
  pricingType: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED';
  minPrice?: number;
  maxPrice?: number;
  requiresQuote: boolean;
  autoAcceptNegotiation: boolean;
}

export default function ServiceDetailPage() {
  const params = useParams()
  const serviceId = params.id as string
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [cartLoading, setCartLoading] = useState(false)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/public/services?id=${serviceId}`)
        if (!res.ok) throw new Error('Service non trouvé')
        
        const services = await res.json()
        const foundService = services.find((s: Service) => s.id === serviceId || s.slug === serviceId)
        
        if (!foundService) throw new Error('Service non trouvé')
        
        setService(foundService)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger le service.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const handleAddToCart = async (price: number, proposedPrice?: number, message?: string) => {
    console.log('Ajout au panier:', { price, proposedPrice, message })
    toast({
      title: "Service ajouté au panier",
      description: `${service?.name} a été ajouté au panier`,
    })
  }

  const handleRequestQuote = async (proposedPrice?: number, message?: string) => {
    console.log('Demande de devis:', { proposedPrice, message })
    toast({
      title: "Demande de devis envoyée",
      description: "Votre demande de devis a été envoyée avec succès",
    })
  }

  const handleQuoteSuccess = (quoteId: string) => {
    setIsQuoteDialogOpen(false)
    toast({
      title: "Demande envoyée !",
      description: "Votre demande de devis a été transmise. Vous pouvez suivre son évolution dans votre profil.",
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Service non trouvé</h1>
        <p className="text-gray-600 mb-8">Le service que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link href="/services">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image placeholder */}
        <div className="space-y-4">
          <div className="aspect-square w-full overflow-hidden rounded-lg border bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400">Image du service</div>
          </div>
        </div>

        {/* Informations service */}
        <div className="space-y-6">
          <div>
            {service.category && (
              <Badge variant="secondary" className="mb-2">
                {service.category.name}
              </Badge>
            )}
            <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
            <div className="flex items-center text-lg text-gray-600 mb-4">
              <Clock className="h-5 w-5 mr-2" />
              <span>{service.duration} minutes</span>
            </div>
          </div>

          {service.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{service.description}</p>
            </div>
          )}

          <div className="border-t pt-6">
            {service.pricingType === 'QUOTE_REQUIRED' || service.requiresQuote ? (
              <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Demander un devis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Demande de devis</DialogTitle>
                  </DialogHeader>
                  <QuoteRequestForm
                    service={service}
                    onSuccess={handleQuoteSuccess}
                    onCancel={() => setIsQuoteDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <ServicePricingSelectorSimple
                service={service}
                quantity={quantity}
                onAddToCart={handleAddToCart}
                onRequestQuote={handleRequestQuote}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 