'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  MessageSquare,
  User,
  Calendar,
  Package,
  DollarSign,
  Send,
  Clock,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  ShoppingBag,
  Star,
  Zap,
  CheckCircle2,
  AlertCircle,
  Circle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import EnhancedMessageInput from '@/components/admin/enhanced-message-input'
import ProposalActions from '@/components/admin/proposal-actions'
import EnhancedQuoteMessageCard from '@/components/admin/enhanced-quote-message-card'

interface Quote {
  id: string
  status: string
  description: string
  budget: number | null
  finalPrice: number | null
  proposedPrice: number | null
  negotiationType: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  service: {
    id: string
    name: string
    price: number | null
    pricingType: string
    description: string | null
  } | null
  product: {
    id: string
    name: string
    price: number | null
    pricingType: string
    description: string | null
  } | null
  messages: Array<{
    id: string
    message: string
    createdAt: string
    isAdminReply: boolean
    sender: {
      name: string | null
      email: string
    }
  }>
}

// Configuration des statuts avec progression améliorée
const statusConfig = {
  PENDING: { 
    label: 'En attente', 
    color: 'bg-amber-500', 
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    progress: 20,
    icon: Clock
  },
  NEGOTIATING: { 
    label: 'En négociation', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    progress: 40,
    icon: MessageSquare
  },
  PRICE_PROPOSED: { 
    label: 'Prix proposé', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    progress: 70,
    icon: TrendingUp
  },
  ACCEPTED: { 
    label: 'Accepté', 
    color: 'bg-green-500', 
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    progress: 100,
    icon: CheckCircle2
  },
  REJECTED: { 
    label: 'Rejeté', 
    color: 'bg-red-500', 
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    progress: 0,
    icon: XCircle
  }
}

const progressSteps = [
  { key: 'PENDING', label: 'Demande', progress: 20 },
  { key: 'NEGOTIATING', label: 'Négociation', progress: 40 },
  { key: 'PRICE_PROPOSED', label: 'Prix proposé', progress: 70 },
  { key: 'ACCEPTED', label: 'Accepté', progress: 100 }
]

export default function AdminQuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposedPrice, setProposedPrice] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [updating, setUpdating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchQuote()
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [quote?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data)
        if (data.proposedPrice) {
          setProposedPrice(data.proposedPrice.toString())
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptProposal = async () => {
    if (!quote) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACCEPTED',
          finalPrice: quote.proposedPrice
        })
      })
      if (response.ok) {
        await fetchQuote()
        alert('Proposition acceptée avec succès !')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'acceptation')
    } finally {
      setUpdating(false)
    }
  }

  const handleProposePrice = async () => {
    if (!proposedPrice || !quote) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PRICE_PROPOSED',
          finalPrice: parseFloat(proposedPrice)
        })
      })
      if (response.ok) {
        await fetchQuote()
        alert('Prix proposé avec succès !')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la proposition')
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette proposition ?')) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      })
      if (response.ok) {
        await fetchQuote()
        alert('Proposition rejetée')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du rejet')
    } finally {
      setUpdating(false)
    }
  }

  const handleSendMessage = async (message: string, files?: any[]) => {
    if (!message.trim() && (!files || files.length === 0)) return
    
    setUpdating(true)
    try {
      // Pour l'instant, on gère seulement les messages texte
      // TODO: Ajouter le support des fichiers plus tard
      const response = await fetch(`/api/admin/quotes/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message.trim(),
          attachments: files ? files.map(f => f.file.name) : []
        })
      })
      
      if (response.ok) {
        await fetchQuote()
        // Le message sera vidé automatiquement par le composant
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleProposalAction = async (action: string, data?: any) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })

      if (response.ok) {
        await fetchQuote()
        // Le toast est géré dans ProposalActions
      } else {
        console.error('Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Clock className="h-12 w-12 animate-spin mx-auto text-blue-500" />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
          </div>
          <p className="text-lg font-medium text-slate-600">Chargement du devis...</p>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <p className="text-lg font-medium text-slate-600">Devis non trouvé</p>
        </div>
      </div>
    )
  }

  const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.PENDING
  const StatusIcon = status.icon
  const itemName = quote.service?.name || quote.product?.name || 'N/A'
  const itemType = quote.service ? 'Service' : 'Produit'
  const basePrice = quote.service?.price || quote.product?.price || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header moderne */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/quotes">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux devis
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${status.bgColor} ${status.borderColor} border`}>
                  <StatusIcon className={`h-6 w-6 ${status.textColor}`} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Devis #{quote.id.slice(-8)}</h1>
                  <p className="text-sm text-slate-500">
                    Créé le {format(new Date(quote.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
            
            <Badge className={`${status.color} text-white px-4 py-2 text-sm font-medium rounded-xl`}>
              {status.label}
            </Badge>
          </div>

          {/* Barre de progression moderne */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Progression du devis</span>
              <span className="text-sm font-bold text-slate-900">{status.progress}%</span>
            </div>
            
            <div className="relative">
              <Progress value={status.progress} className="h-2 bg-slate-200" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full opacity-20"></div>
            </div>
            
            <div className="flex justify-between text-xs">
              {progressSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center space-y-1">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    status.progress >= step.progress 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-white border-slate-300'
                  }`} />
                  <span className={`text-xs ${
                    status.progress >= step.progress 
                      ? 'text-blue-600 font-medium' 
                      : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Colonne principale - 3/4 */}
          <div className="xl:col-span-3 space-y-6">
            {/* Actions rapides */}
            {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Accepter la proposition */}
                  {quote.proposedPrice && quote.status !== 'ACCEPTED' && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">Accepter la proposition</p>
                            <p className="text-sm text-green-700">
                              Prix proposé: <PriceWithConversion price={quote.proposedPrice} />
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleAcceptProposal}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accepter
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Proposer un autre prix */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <Label className="text-blue-900 font-semibold">
                          Proposer un autre prix
                        </Label>
                      </div>
                      <div className="flex gap-3">
                        <Input
                          type="number"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          placeholder="Montant en Ar"
                          className="flex-1 rounded-xl border-blue-200 focus:border-blue-400"
                        />
                        <Button
                          onClick={handleProposePrice}
                          disabled={updating || !proposedPrice}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Proposer
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rejeter */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleReject}
                      disabled={updating}
                      variant="destructive"
                      className="rounded-xl"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter la proposition
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Article concerné */}
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-slate-600" />
                  Article concerné
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Image de l'article */}
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                    {quote.service ? (
                      <Star className="h-8 w-8 text-slate-400" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  
                  {/* Détails de l'article */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {itemType}
                      </Badge>
                      <h3 className="text-lg font-semibold text-slate-900">{itemName}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Prix de base</p>
                        <p className="font-semibold text-slate-900">
                          <PriceWithConversion price={basePrice} />
                        </p>
                      </div>
                      {quote.proposedPrice && (
                        <div>
                          <p className="text-slate-500">Proposition client</p>
                          <p className="font-semibold text-blue-600">
                            <PriceWithConversion price={quote.proposedPrice} />
                          </p>
                        </div>
                      )}
                      {quote.finalPrice && (
                        <div>
                          <p className="text-slate-500">Prix final</p>
                          <p className="font-semibold text-green-600">
                            <PriceWithConversion price={quote.finalPrice} />
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Message du client</p>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{quote.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions de proposition pour les devis de produits */}
            {quote.negotiationType === 'PRODUCT_PRICE' && 
             (quote.status === 'PENDING' || quote.status === 'NEGOTIATING') && (
              <ProposalActions
                quote={{
                  id: quote.id,
                  status: quote.status,
                  proposedPrice: quote.proposedPrice,
                  finalPrice: quote.finalPrice,
                  negotiationType: quote.negotiationType,
                  product: quote.product,
                  service: quote.service
                }}
                onAction={handleProposalAction}
              />
            )}

            {/* Conversation moderne type messagerie */}
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Conversation ({quote.messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Zone de messages scrollable */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                  {/* Carte enrichie du produit/service avec actions intégrées */}
                  {(quote.negotiationType === 'PRODUCT_PRICE' || quote.negotiationType === 'PRODUCT_QUOTE') && 
                   (quote.status === 'PENDING' || quote.status === 'NEGOTIATING') && (
                    <EnhancedQuoteMessageCard
                      quote={{
                        id: quote.id,
                        status: quote.status,
                        proposedPrice: quote.proposedPrice,
                        finalPrice: quote.finalPrice,
                        negotiationType: quote.negotiationType,
                        budget: quote.budget,
                        description: quote.description,
                        product: quote.product,
                        service: quote.service,
                        user: quote.user
                      }}
                      onAction={handleProposalAction}
                      compact={true}
                    />
                  )}
                  
                  {quote.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdminReply ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.isAdminReply ? 'order-2' : 'order-1'}`}>
                        <div className={`flex items-start gap-3 ${message.isAdminReply ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                            <AvatarFallback className={`text-xs font-medium ${
                              message.isAdminReply 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {message.isAdminReply ? 'AD' : (message.sender.name?.[0] || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Message bubble */}
                          <div className={`space-y-1 ${message.isAdminReply ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-3 rounded-2xl shadow-sm ${
                              message.isAdminReply
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.message}</p>
                            </div>
                            <div className={`flex items-center gap-2 text-xs text-slate-400 ${
                              message.isAdminReply ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="font-medium">
                                {message.sender.name || message.sender.email}
                              </span>
                              <span>•</span>
                              <span>
                                {format(new Date(message.createdAt), 'dd/MM à HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie avancée avec emojis et fichiers */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  <EnhancedMessageInput
                    value={replyMessage}
                    onChange={setReplyMessage}
                    onSend={handleSendMessage}
                    disabled={updating}
                    placeholder="Tapez votre réponse... (Shift+Entrée pour nouvelle ligne)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/4 */}
          <div className="space-y-6">
            {/* Informations client */}
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                      {quote.user.name?.[0] || quote.user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {quote.user.name || 'Client'}
                    </p>
                    <p className="text-sm text-slate-500">Particulier</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{quote.user.email}</span>
                  </div>
                  {quote.user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{quote.user.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Résumé financier */}
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Résumé financier
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Prix de base</span>
                    <span className="font-semibold text-slate-900">
                      <PriceWithConversion price={basePrice} />
                    </span>
                  </div>
                  {quote.proposedPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Proposition client</span>
                      <span className="font-semibold text-blue-600">
                        <PriceWithConversion price={quote.proposedPrice} />
                      </span>
                    </div>
                  )}
                  {quote.finalPrice && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                        <span className="font-semibold text-green-900">Prix final</span>
                        <span className="font-bold text-green-600 text-lg">
                          <PriceWithConversion price={quote.finalPrice} />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Historique */}
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Créé le</span>
                  <span className="font-medium text-slate-900">
                    {format(new Date(quote.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Modifié le</span>
                  <span className="font-medium text-slate-900">
                    {format(new Date(quote.updatedAt), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Messages</span>
                  <span className="font-medium text-slate-900">
                    {quote.messages.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}