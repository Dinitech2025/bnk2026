'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  X, 
  MessageSquare, 
  DollarSign,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ProposalActionsProps {
  quote: {
    id: string
    status: string
    proposedPrice?: number
    finalPrice?: number
    negotiationType: string
    product?: {
      name: string
      price: number
    }
    service?: {
      name: string
      price: number
    }
  }
  onAction: (action: string, data?: any) => Promise<void>
}

export default function ProposalActions({ quote, onAction }: ProposalActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [showCounterForm, setShowCounterForm] = useState(false)

  const itemName = quote.service?.name || quote.product?.name || 'Article'
  const basePrice = quote.service?.price || quote.product?.price || 0
  const proposedPrice = quote.proposedPrice || 0

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

  // Ne pas afficher si déjà traité
  if (quote.status === 'ACCEPTED' || quote.status === 'REJECTED') {
    return (
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
      <CardContent className="p-4 space-y-4">
        {/* Résumé de la proposition */}
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Proposition de prix
            </h4>
            <Badge className="bg-orange-100 text-orange-700">En attente</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Article:</p>
              <p className="font-medium">{itemName}</p>
            </div>
            <div>
              <p className="text-slate-600">Prix de base:</p>
              <p className="font-medium">{basePrice.toLocaleString()} Ar</p>
            </div>
            <div>
              <p className="text-slate-600">Prix proposé:</p>
              <p className="font-bold text-blue-600">{proposedPrice.toLocaleString()} Ar</p>
            </div>
            <div>
              <p className="text-slate-600">Différence:</p>
              <p className={`font-medium ${proposedPrice < basePrice ? 'text-red-600' : 'text-green-600'}`}>
                {proposedPrice < basePrice ? '-' : '+'}{Math.abs(proposedPrice - basePrice).toLocaleString()} Ar
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!showCounterForm ? (
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Accepter
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
      </CardContent>
    </Card>
  )
}



