'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  ShoppingCart, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  Check,
  DollarSign
} from 'lucide-react'
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

export function ServicePricingSelector({
  service,
  quantity,
  onAddToCart,
  onRequestQuote,
  loading = false
}: ServicePricingSelectorProps) {
  const { toast } = useToast()
  const [proposedPrice, setProposedPrice] = useState<number>(service.price)
  const [clientMessage, setClientMessage] = useState('')
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)

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
    if (service.pricingType === 'RANGE' && service.minPrice && service.maxPrice) {
      // Vérifier si le prix est dans la plage
      if (proposedPrice >= service.minPrice && proposedPrice <= service.maxPrice) {
        if (service.autoAcceptNegotiation) {
          // Auto-accepter si dans la plage et autorisé
          await onAddToCart(proposedPrice, proposedPrice, clientMessage)
          toast({
            title: "Prix accepté automatiquement",
            description: `Votre prix de ${proposedPrice}€ a été accepté`
          })
          setShowNegotiationDialog(false)
          return
        }
      }
    }

    // Sinon, envoyer pour validation
    await onAddToCart(service.price, proposedPrice, clientMessage)
    toast({
      title: "Proposition envoyée",
      description: "Votre proposition de prix a été envoyée pour validation"
    })
    setShowNegotiationDialog(false)
  }

  const handleQuoteRequest = async () => {
    await onRequestQuote(proposedPrice, clientMessage)
    toast({
      title: "Demande de devis envoyée",
      description: "Votre demande de devis a été envoyée. Vous recevrez une réponse sous 24-48h"
    })
    setShowQuoteDialog(false)
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
              <Button 
                onClick={() => setShowNegotiationDialog(true)} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Proposer un prix
              </Button>
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
              <Button 
                onClick={() => setShowNegotiationDialog(true)} 
                className="w-full"
                disabled={loading}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Choisir un prix
              </Button>
            </div>
          </div>
        )

      case 'QUOTE_REQUIRED':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                <Clock className="h-4 w-4 mr-1" />
                Devis requis
              </Badge>
              <div className="text-sm text-gray-600">
                Le prix dépend de vos besoins spécifiques
              </div>
            </div>
            <Button 
              onClick={() => setShowQuoteDialog(true)} 
              className="w-full"
              disabled={loading}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Demander un devis
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {service.duration} minutes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderPricingContent()}
        </CardContent>
      </Card>

      {/* Dialog pour négociation */}
      <Dialog open={showNegotiationDialog} onOpenChange={setShowNegotiationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposer un prix</DialogTitle>
            <DialogDescription>
              {service.pricingType === 'RANGE' 
                ? `Choisissez un prix entre ${service.minPrice}€ et ${service.maxPrice}€`
                : `Prix suggéré : ${service.price}€`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposed-price">Prix proposé (€)</Label>
              {service.pricingType === 'RANGE' && service.minPrice && service.maxPrice ? (
                <div className="space-y-2">
                  <Slider
                    value={[proposedPrice]}
                    onValueChange={(value) => setProposedPrice(value[0])}
                    max={service.maxPrice}
                    min={service.minPrice}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{service.minPrice}€</span>
                    <span className="font-medium">{proposedPrice}€</span>
                    <span>{service.maxPrice}€</span>
                  </div>
                </div>
              ) : (
                <Input
                  id="proposed-price"
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              )}
            </div>
            
            <div>
              <Label htmlFor="client-message">Message (optionnel)</Label>
              <Textarea
                id="client-message"
                placeholder="Expliquez votre proposition de prix..."
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                rows={3}
              />
            </div>

            {service.pricingType === 'RANGE' && 
             service.minPrice && 
             service.maxPrice && 
             proposedPrice >= service.minPrice && 
             proposedPrice <= service.maxPrice &&
             service.autoAcceptNegotiation && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Ce prix sera accepté automatiquement
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNegotiationDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleNegotiation} disabled={loading}>
              Envoyer la proposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour demande de devis */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander un devis</DialogTitle>
            <DialogDescription>
              Décrivez vos besoins pour recevoir un devis personnalisé
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget">Budget approximatif (€) - optionnel</Label>
              <Input
                id="budget"
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(Number(e.target.value))}
                placeholder="Votre budget approximatif"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="requirements">Détails de votre demande</Label>
              <Textarea
                id="requirements"
                placeholder="Décrivez vos besoins spécifiques, contraintes, délais..."
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                Vous recevrez une réponse détaillée sous 24-48h avec un prix personnalisé
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleQuoteRequest} 
              disabled={loading || !clientMessage.trim()}
            >
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 