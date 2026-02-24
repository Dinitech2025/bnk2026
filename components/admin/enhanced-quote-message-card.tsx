'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface QuoteItem {
  id: string
  name: string
  price: number
  pricingType?: string
  description?: string
  images?: Array<{ path: string; alt?: string }>
  slug?: string
}

interface EnhancedQuoteMessageCardProps {
  quote: {
    id: string
    status: string
    proposedPrice?: number
    finalPrice?: number
    negotiationType: string
    budget?: number
    description: string
    product?: QuoteItem
    service?: QuoteItem
    user: {
      id: string
      name?: string
      email: string
    }
  }
  onAction: (action: string, data?: any) => Promise<void>
  compact?: boolean
}

export default function EnhancedQuoteMessageCard({ 
  quote, 
  onAction, 
  compact = false 
}: EnhancedQuoteMessageCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [showCounterForm, setShowCounterForm] = useState(false)

  const item = quote.service || quote.product
  const itemType = quote.service ? 'service' : 'product'
  const itemName = item?.name || 'Article'
  const basePrice = item?.price || 0
  const proposedPrice = quote.proposedPrice || 0
  const budget = quote.budget || 0

  // Obtenir l'image du produit/service
  const getItemImage = () => {
    if (item?.images && item.images.length > 0) {
      return item.images[0].path
    }
    return null
  }

  // Obtenir le lien vers l'article
  const getItemLink = () => {
    if (!item) return '#'
    const baseUrl = itemType === 'service' ? '/services' : '/products'
    return `${baseUrl}/${item.slug || item.id}`
  }

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      console.log('🎯 Acceptation de la proposition:', proposedPrice)
      await onAction('accept', { finalPrice: proposedPrice })
      setShowCounterForm(false)
      console.log('✅ Proposition acceptée avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de l\'acceptation:', error)
      toast.error('Erreur lors de l\'acceptation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      console.log('🎯 Rejet de la proposition')
      await onAction('reject')
      setShowCounterForm(false)
      console.log('✅ Proposition rejetée avec succès')
    } catch (error) {
      console.error('❌ Erreur lors du rejet:', error)
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
      console.log('🎯 Contre-proposition:', Number(counterPrice))
      await onAction('counter', { 
        counterPrice: Number(counterPrice),
        message: counterMessage.trim() || `Nous vous proposons un prix de ${Number(counterPrice).toLocaleString()} Ar pour ${itemName}.`
      })
      setShowCounterForm(false)
      setCounterPrice('')
      setCounterMessage('')
      console.log('✅ Contre-proposition envoyée avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsLoading(false)
    }
  }

  // Version compacte pour intégration dans le chat
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 my-3">
        <div className="flex items-start gap-3">
          {/* Image du produit/service */}
          <div className="flex-shrink-0">
            {getItemImage() ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={getItemImage()!}
                  alt={itemName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                {itemType === 'service' ? (
                  <Star className="h-6 w-6 text-slate-400" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Informations et actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-slate-900 truncate">{itemName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {itemType === 'service' ? 'Service' : 'Produit'}
                  </Badge>
                  <Link 
                    href={getItemLink()} 
                    target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </Link>
                </div>
              </div>
              
              {quote.negotiationType === 'PRODUCT_PRICE' && (
                <Badge className="bg-orange-100 text-orange-700 text-xs">
                  Négociation
                </Badge>
              )}
            </div>

            {/* Prix et proposition */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <p className="text-slate-600">Prix de base</p>
                <p className="font-medium">{basePrice.toLocaleString()} Ar</p>
              </div>
              {proposedPrice > 0 && (
                <div>
                  <p className="text-slate-600">Prix proposé</p>
                  <p className="font-bold text-blue-600">{proposedPrice.toLocaleString()} Ar</p>
                </div>
              )}
            </div>

            {/* Actions rapides */}
            {quote.status === 'PENDING' && quote.negotiationType === 'PRODUCT_PRICE' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 h-8 bg-green-500 hover:bg-green-600 text-white text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accepter
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCounterForm(!showCounterForm)}
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Négocier
                </Button>
                <Button
                  size="sm"
                  onClick={handleReject}
                  disabled={isLoading}
                  variant="outline"
                  className="h-8 px-3 text-xs text-red-600 border-red-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Formulaire de contre-proposition */}
            {showCounterForm && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 space-y-2">
                <Input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Votre prix..."
                  className="text-sm h-8"
                />
                <Textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Message (optionnel)..."
                  className="text-sm h-16 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCounterProposal}
                    disabled={isLoading || !counterPrice}
                    className="flex-1 h-7 text-xs"
                  >
                    Envoyer
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowCounterForm(false)
                      setCounterPrice('')
                      setCounterMessage('')
                    }}
                    variant="outline"
                    className="h-7 px-3 text-xs"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Version complète (existante)
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Image du produit/service */}
          <div className="flex-shrink-0">
            {getItemImage() ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={getItemImage()!}
                  alt={itemName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                {itemType === 'service' ? (
                  <Star className="h-8 w-8 text-slate-400" />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Informations détaillées */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{itemName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline">
                    {itemType === 'service' ? 'Service' : 'Produit'}
                  </Badge>
                  <Link 
                    href={getItemLink()} 
                    target="_blank"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir la page
                  </Link>
                </div>
              </div>
              
              <Badge className="bg-orange-100 text-orange-700">
                {quote.status === 'PENDING' ? 'En attente' : quote.status}
              </Badge>
            </div>

            {item?.description && (
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Résumé de la proposition */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Détails de la demande
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Prix de base:</p>
              <p className="font-medium">{basePrice.toLocaleString()} Ar</p>
            </div>
            {proposedPrice > 0 && (
              <div>
                <p className="text-slate-600">Prix proposé:</p>
                <p className="font-bold text-blue-600">{proposedPrice.toLocaleString()} Ar</p>
              </div>
            )}
            {budget > 0 && (
              <div>
                <p className="text-slate-600">Budget client:</p>
                <p className="font-medium text-green-600">{budget.toLocaleString()} Ar</p>
              </div>
            )}
            {proposedPrice > 0 && (
              <div>
                <p className="text-slate-600">Différence:</p>
                <p className={`font-medium ${proposedPrice < basePrice ? 'text-red-600' : 'text-green-600'}`}>
                  {proposedPrice < basePrice ? '-' : '+'}{Math.abs(proposedPrice - basePrice).toLocaleString()} Ar
                </p>
              </div>
            )}
          </div>

          {quote.description && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-slate-600 text-sm">Description de la demande:</p>
              <p className="text-sm mt-1">{quote.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {quote.status === 'PENDING' && quote.negotiationType === 'PRODUCT_PRICE' && (
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
                <div className="bg-white rounded-lg p-3 border border-blue-100 space-y-3">
                  <div>
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
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Message personnalisé (optionnel)
                    </label>
                    <Textarea
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder="Ajoutez un message pour expliquer votre proposition..."
                      className="w-full h-20 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>Le client recevra votre prix et votre message</span>
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
