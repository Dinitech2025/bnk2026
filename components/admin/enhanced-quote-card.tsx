'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Check, 
  X, 
  MessageSquare, 
  DollarSign,
  AlertCircle,
  Loader2,
  ExternalLink,
  Package,
  Star,
  ShoppingBag,
  Eye,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface EnhancedQuoteCardProps {
  quote: {
    id: string
    status: string
    proposedPrice?: number
    finalPrice?: number
    negotiationType: string
    description: string
    budget?: number
    product?: {
      id: string
      name: string
      price: number
      slug?: string
      images?: Array<{ path: string; url?: string }>
    }
    service?: {
      id: string
      name: string
      price: number
      slug?: string
      images?: Array<{ path: string; url?: string }>
    }
  }
  onAction: (action: string, data?: any) => Promise<void>
  compact?: boolean
}

export default function EnhancedQuoteCard({ quote, onAction, compact = false }: EnhancedQuoteCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [showCounterForm, setShowCounterForm] = useState(false)

  const item = quote.service || quote.product
  const itemType = quote.service ? 'service' : 'product'
  const itemName = item?.name || 'Article'
  const basePrice = item?.price || 0
  const proposedPrice = quote.proposedPrice || 0
  
  // URL de l'image
  const getImageUrl = () => {
    const images = item?.images
    if (images && images.length > 0) {
      return images[0].url || images[0].path || null
    }
    return null
  }

  // URL vers la page du produit/service
  const getItemUrl = () => {
    if (!item) return '#'
    const slug = item.slug || item.id
    return itemType === 'service' ? `/services/${slug}` : `/products/${slug}`
  }

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAction('accept', { finalPrice: proposedPrice })
      toast.success('Proposition acceptée')
      setShowCounterForm(false)
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      await onAction('reject')
      toast.success('Proposition rejetée')
      setShowCounterForm(false)
    } catch (error) {
      toast.error('Erreur lors du rejet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCounterProposal = async () => {
    if (!counterPrice || isNaN(Number(counterPrice))) {
      toast.error('Veuillez entrer un prix valide')
      return
    }

    setIsLoading(true)
    try {
      await onAction('counter', { 
        counterPrice: Number(counterPrice),
        message: `Contre-proposition: ${Number(counterPrice).toLocaleString()} Ar pour ${itemName}`
      })
      toast.success('Contre-proposition envoyée')
      setShowCounterForm(false)
      setCounterPrice('')
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsLoading(false)
    }
  }

  // Affichage compact pour les messages
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 my-2">
        <div className="flex items-start gap-3">
          {/* Image du produit/service */}
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            {getImageUrl() ? (
              <Image
                src={getImageUrl()!}
                alt={itemName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {itemType === 'service' ? (
                  <Star className="h-6 w-6 text-slate-400" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-slate-900 truncate">{itemName}</h4>
              <Badge variant="outline" className="text-xs">
                {itemType === 'service' ? 'Service' : 'Produit'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
              <span>Prix proposé: <strong className="text-blue-600">{proposedPrice.toLocaleString()} Ar</strong></span>
              <span>Prix de base: {basePrice.toLocaleString()} Ar</span>
            </div>

            {/* Actions rapides */}
            {(quote.status === 'PENDING' || quote.status === 'NEGOTIATING') && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="h-7 px-3 bg-green-500 hover:bg-green-600 text-white text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCounterForm(!showCounterForm)}
                  className="h-7 px-3 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Contre-proposer
                </Button>
                <Link href={getItemUrl()} target="_blank">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                </Link>
              </div>
            )}

            {/* Formulaire de contre-proposition */}
            {showCounterForm && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    placeholder="Nouveau prix..."
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleCounterProposal}
                    disabled={isLoading || !counterPrice}
                    className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs"
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Envoyer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Affichage complet pour la section dédiée
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900">Demande de devis</h3>
          </div>
          <Badge className="bg-orange-100 text-orange-700">
            {quote.status === 'PENDING' ? 'En attente' : 
             quote.status === 'NEGOTIATING' ? 'En négociation' :
             quote.status === 'ACCEPTED' ? 'Accepté' : 'Traité'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations sur l'article avec image */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-4">
            {/* Image */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              {getImageUrl() ? (
                <Image
                  src={getImageUrl()!}
                  alt={itemName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {itemType === 'service' ? (
                    <Star className="h-8 w-8 text-slate-400" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                  )}
                </div>
              )}
            </div>

            {/* Détails */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-slate-900">{itemName}</h4>
                <Badge variant="outline">
                  {itemType === 'service' ? 'Service' : 'Produit'}
                </Badge>
              </div>
              
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {quote.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Prix de base:</p>
                  <p className="font-medium">{basePrice.toLocaleString()} Ar</p>
                </div>
                <div>
                  <p className="text-slate-600">Prix proposé:</p>
                  <p className="font-bold text-blue-600">{proposedPrice.toLocaleString()} Ar</p>
                </div>
                {quote.budget && (
                  <div>
                    <p className="text-slate-600">Budget client:</p>
                    <p className="font-medium">{quote.budget.toLocaleString()} Ar</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-600">Différence:</p>
                  <p className={`font-medium ${proposedPrice < basePrice ? 'text-red-600' : 'text-green-600'}`}>
                    {proposedPrice < basePrice ? '-' : '+'}{Math.abs(proposedPrice - basePrice).toLocaleString()} Ar
                  </p>
                </div>
              </div>

              {/* Lien vers la page */}
              <div className="mt-3">
                <Link href={getItemUrl()} target="_blank">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir la page {itemType === 'service' ? 'du service' : 'du produit'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(quote.status === 'PENDING' || quote.status === 'NEGOTIATING') && (
          <>
            {!showCounterForm ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Accepter la proposition
                </Button>
                
                <Button
                  onClick={() => setShowCounterForm(true)}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contre-proposer
                </Button>
                
                <Button
                  onClick={handleReject}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  Refuser
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Votre contre-proposition (Ar)
                  </label>
                  <Input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    placeholder="Entrez votre prix..."
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>Le client recevra votre contre-proposition par message</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCounterProposal}
                    disabled={isLoading || !counterPrice}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                    Envoyer contre-proposition
                  </Button>
                  
                  <Button
                    onClick={() => setShowCounterForm(false)}
                    variant="outline"
                    className="px-4"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* État final */}
        {(quote.status === 'ACCEPTED' || quote.status === 'REJECTED') && (
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              {quote.status === 'ACCEPTED' ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium text-slate-900">
                  Proposition {quote.status === 'ACCEPTED' ? 'acceptée' : 'rejetée'}
                </p>
                {quote.finalPrice && (
                  <p className="text-sm text-slate-600">
                    Prix final: {quote.finalPrice.toLocaleString()} Ar
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



