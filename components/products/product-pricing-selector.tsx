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
  DollarSign,
  Package,
  Hammer,
  TrendingUp,
  Users,
  Plus,
  Minus
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export type ProductPricingType = 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED' | 'AUCTION'

export interface ProductPricingData {
  id: string
  name: string
  price: number
  minPrice?: number
  maxPrice?: number
  pricingType: ProductPricingType
  inventory: number
  requiresQuote: boolean
  autoAcceptNegotiation: boolean
  auctionEndDate?: Date | string
  minimumBid?: number
  currentHighestBid?: number
}

interface ProductPricingSelectorProps {
  product: ProductPricingData
  quantity: number
  onAddToCart: (price: number, proposedPrice?: number, message?: string) => Promise<void>
  onRequestQuote: (proposedPrice?: number, message?: string) => Promise<void>
  loading?: boolean
  hidePrice?: boolean
}

export function ProductPricingSelector({
  product,
  quantity,
  onAddToCart,
  onRequestQuote,
  loading = false,
  hidePrice = false
}: ProductPricingSelectorProps) {
  const { toast } = useToast()
  const [proposedPrice, setProposedPrice] = useState<number>(product.price)
  const [clientMessage, setClientMessage] = useState('')
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)

  const handleFixedPricing = async () => {
    try {
      await onAddToCart(product.price)
      toast({
        title: "Produit ajouté au panier",
        description: "Le produit a été ajouté avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit au panier",
        variant: "destructive"
      })
    }
  }

  const handleNegotiation = async () => {
    try {
      // Pour les produits RANGE avec auto-acceptation
      if (product.pricingType === 'RANGE' && product.minPrice && product.maxPrice) {
        if (proposedPrice >= product.minPrice && proposedPrice <= product.maxPrice) {
          if (product.autoAcceptNegotiation) {
            // Auto-accepter si dans la plage et autorisé
            await onAddToCart(proposedPrice, proposedPrice, clientMessage)
            toast({
              title: "Prix accepté automatiquement",
              description: `Votre prix de ${proposedPrice} Ar a été accepté`
            })
            setShowNegotiationDialog(false)
            return
          }
        }
      }

      // Pour tous les autres cas, créer une proposition via le système de devis
      const response = await fetch('/api/quotes/product-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          proposedPrice: proposedPrice,
          clientMessage: clientMessage
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la proposition')
      }

      toast({
        title: "Proposition envoyée",
        description: "Votre proposition de prix a été envoyée pour validation admin. Vous recevrez une réponse dans votre profil."
      })
      
      setShowNegotiationDialog(false)
      setProposedPrice(product.price)
      setClientMessage('')
      
    } catch (error) {
      console.error('Erreur lors de la négociation:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer la proposition",
        variant: "destructive"
      })
    }
  }

  const handleQuoteRequest = async () => {
    try {
      // Pour les produits QUOTE_REQUIRED, utiliser la nouvelle API
      if (product.pricingType === 'QUOTE_REQUIRED') {
        const response = await fetch('/api/quotes/product-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            description: `Demande de devis pour ${product.name}`,
            clientMessage: clientMessage.trim(),
            budget: proposedPrice || null
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de l\'envoi du devis')
        }

        const result = await response.json()
        console.log('✅ Devis créé:', result)

        toast({
          title: "Demande de devis envoyée",
          description: "Votre demande de devis a été envoyée. Vous recevrez une réponse sous 24-48h"
        })
      } else {
        // Pour les autres types, utiliser la fonction callback
        await onRequestQuote(proposedPrice, clientMessage)
        toast({
          title: "Demande de devis envoyée", 
          description: "Votre demande de devis a été envoyée. Vous recevrez une réponse sous 24-48h"
        })
      }

      setShowQuoteDialog(false)
      setClientMessage('')
    } catch (error) {
      console.error('❌ Erreur:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer la demande de devis",
        variant: "destructive"
      })
    }
  }

  const renderPricingContent = () => {
    switch (product.pricingType) {
      case 'FIXED':
        return (
          <div className="space-y-3">
            {/* Quantité et Stock sur la même ligne */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Quantité:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="px-3 py-1 min-w-[2rem] text-center text-sm">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                    disabled={quantity >= product.inventory}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Indicateur de stock à droite */}
              {product.inventory > 0 ? (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  En stock
                </div>
              ) : (
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Rupture
                </div>
              )}
            </div>

            <Button 
              onClick={handleFixedPricing} 
              className="w-full"
              disabled={loading || product.inventory === 0}
              variant="danger"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {loading ? 'Ajout...' : product.inventory === 0 ? 'Rupture' : 'Ajouter au panier'}
            </Button>
          </div>
        )

      case 'NEGOTIABLE':
        return (
          <div className="space-y-4">
            {!hidePrice && (
              <div className="text-3xl font-bold text-primary mb-4">
                {product.price.toLocaleString()} Ar <Badge variant="secondary">Négociable</Badge>
              </div>
            )}
            <div className="space-y-3">
              {/* Quantité et Stock sur la même ligne */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Quantité:</span>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 py-1 min-w-[2rem] text-center text-sm">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock || 0, quantity + 1))}
                      disabled={quantity >= (product.stock || 0)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Indicateur de stock à droite */}
                {(product.stock || 0) > 0 ? (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    En stock
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 text-sm font-medium">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Rupture
                  </div>
                )}
              </div>

              {/* Boutons côte à côte */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleFixedPricing} 
                  disabled={loading || product.inventory === 0}
                  variant="danger"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {loading ? 'Ajout...' : product.inventory === 0 ? 'Rupture' : 'Accepter'}
                </Button>
                <Button 
                  onClick={() => setShowNegotiationDialog(true)} 
                  variant="outline" 
                  disabled={loading || product.inventory === 0}
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Proposer
                </Button>
              </div>
            </div>
            {product.inventory > 0 && product.inventory <= 10 && (
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Plus que {product.inventory} en stock
              </p>
            )}
          </div>
        )

      case 'RANGE':
        return (
          <div className="space-y-4">
            {!hidePrice && (
              <div className="text-center mb-4">
                <div className="text-sm text-gray-600 mb-1">Plage de prix</div>
                <div className="text-2xl font-bold text-primary">
                  {product.minPrice?.toLocaleString()} Ar - {product.maxPrice?.toLocaleString()} Ar
                </div>
              </div>
            )}
            <div className="space-y-3">
              {/* Quantité et Stock sur la même ligne */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Quantité:</span>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 py-1 min-w-[2rem] text-center text-sm">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock || 0, quantity + 1))}
                      disabled={quantity >= (product.stock || 0)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Indicateur de stock à droite */}
                {(product.stock || 0) > 0 ? (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    En stock
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 text-sm font-medium">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Rupture
                  </div>
                )}
              </div>

              {/* Bouton unique pour RANGE */}
              <Button 
                onClick={() => setShowNegotiationDialog(true)} 
                className="w-full"
                disabled={loading || product.inventory === 0}
                variant="danger"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {loading ? 'En cours...' : product.inventory === 0 ? 'Rupture' : 'Choisir un prix'}
              </Button>
            </div>
          </div>
        )

      case 'QUOTE_REQUIRED':
        return (
          <div className="space-y-4">
            {!hidePrice && (
              <div className="text-center mb-4">
                <Badge variant="outline" className="mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  Devis requis
                </Badge>
                <div className="text-sm text-gray-600">
                  Le prix dépend de vos besoins spécifiques
                </div>
              </div>
            )}
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
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {renderPricingContent()}

        {/* Dialog pour négociation */}
        <Dialog open={showNegotiationDialog} onOpenChange={setShowNegotiationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Proposer un prix</DialogTitle>
              <DialogDescription>
                {product.pricingType === 'RANGE' 
                  ? `Choisissez un prix entre ${product.minPrice?.toLocaleString()} et ${product.maxPrice?.toLocaleString()} Ar`
                  : "Proposez votre prix. Nous l'étudierons et vous répondrons rapidement."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="proposed-price">Votre prix proposé (Ar)</Label>
                <Input
                  id="proposed-price"
                  type="number"
                  min={product.minPrice || 0}
                  max={product.maxPrice || undefined}
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(parseFloat(e.target.value))}
                />
                {product.pricingType === 'RANGE' && product.minPrice && product.maxPrice && (
                  <Slider
                    min={product.minPrice}
                    max={product.maxPrice}
                    step={1000}
                    value={[proposedPrice]}
                    onValueChange={(value) => setProposedPrice(value[0])}
                    className="mt-2"
                  />
                )}
                {product.pricingType === 'RANGE' && product.autoAcceptNegotiation && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Les prix dans cette plage sont acceptés automatiquement
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-message">Message (optionnel)</Label>
                <Textarea
                  id="client-message"
                  placeholder="Expliquez pourquoi vous proposez ce prix..."
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowNegotiationDialog(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleNegotiation}>
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
                Décrivez vos besoins et nous vous proposerons un prix personnalisé
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quote-message">Décrivez vos besoins *</Label>
                <Textarea
                  id="quote-message"
                  placeholder="Expliquez ce que vous recherchez, la quantité, les spécificités..."
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-budget">Budget indicatif (Ar, optionnel)</Label>
                <Input
                  id="quote-budget"
                  type="number"
                  min={0}
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(parseFloat(e.target.value))}
                  placeholder="Votre budget approximatif"
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Délai de réponse</h4>
                    <p className="text-sm text-blue-700">
                      Nous vous répondrons sous 24-48h avec un devis personnalisé
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowQuoteDialog(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleQuoteRequest}
                disabled={!clientMessage.trim()}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Envoyer la demande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

