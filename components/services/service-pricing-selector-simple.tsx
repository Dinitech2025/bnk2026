'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, MessageSquare, DollarSign } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export type ServicePricingType = 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED'

export interface ServicePricingData {
  id: string
  name: string
  price: number
  minPrice?: number
  maxPrice?: number
  pricingType: ServicePricingType
  duration: number
  requiresQuote: boolean
  autoAcceptNegotiation: boolean
}

interface ServicePricingSelectorProps {
  service: ServicePricingData
  quantity: number
  onAddToCart: (price: number, proposedPrice?: number, message?: string) => Promise<void>
  onRequestQuote: (proposedPrice?: number, message?: string) => Promise<void>
  loading?: boolean
}

export function ServicePricingSelectorSimple({
  service,
  quantity,
  onAddToCart,
  onRequestQuote,
  loading = false
}: ServicePricingSelectorProps) {
  const { toast } = useToast()
  const [proposedPrice, setProposedPrice] = useState<number>(service.price)
  const [clientMessage, setClientMessage] = useState('')

  const handleFixedPricing = async () => {
    try {
      await onAddToCart(service.price)
      toast({
        title: "Service ajouté au panier",
        description: "Le service a été ajouté avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le service au panier",
        variant: "destructive"
      })
    }
  }

  const handleNegotiation = async () => {
    await onAddToCart(service.price, proposedPrice, clientMessage)
    toast({
      title: "Proposition envoyée",
      description: "Votre proposition de prix a été envoyée pour validation"
    })
  }

  const handleQuoteRequest = async () => {
    await onRequestQuote(proposedPrice, clientMessage)
    toast({
      title: "Demande de devis envoyée",
      description: "Votre demande de devis a été envoyée"
    })
  }

  const renderPricingContent = () => {
    switch (service.pricingType) {
      case 'FIXED':
        return (
          <div className="space-y-4">
            <div className="text-3xl font-bold text-primary">
              {service.price}€
            </div>
            <Button 
              onClick={handleFixedPricing} 
              className="w-full h-12"
              disabled={loading}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Ajouter au panier
            </Button>
          </div>
        )

      case 'NEGOTIABLE':
        return (
          <div className="space-y-4">
            <div className="text-3xl font-bold text-primary">
              {service.price}€ <Badge variant="secondary">Négociable</Badge>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleFixedPricing} 
                className="w-full"
                disabled={loading}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Accepter ce prix
              </Button>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Votre prix proposé"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                />
                <Button 
                  onClick={handleNegotiation} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Proposer un prix
                </Button>
              </div>
            </div>
          </div>
        )

      case 'RANGE':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Plage de prix</div>
              <div className="text-2xl font-bold text-primary">
                {service.minPrice}€ - {service.maxPrice}€
              </div>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder={`Prix entre ${service.minPrice}€ et ${service.maxPrice}€`}
                value={proposedPrice}
                onChange={(e) => setProposedPrice(Number(e.target.value))}
                min={service.minPrice}
                max={service.maxPrice}
              />
              <Button 
                onClick={handleNegotiation} 
                className="w-full"
                disabled={loading}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Choisir ce prix
              </Button>
            </div>
          </div>
        )

      case 'QUOTE_REQUIRED':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Devis requis
              </Badge>
              <div className="text-sm text-gray-600">
                Le prix dépend de vos besoins spécifiques
              </div>
            </div>
            <Button 
              onClick={handleQuoteRequest} 
              className="w-full"
              disabled={loading}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Demander un devis
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {renderPricingContent()}
    </div>
  )
} 