'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { 
  MessageSquare, 
  Clock, 
  DollarSign, 
  Eye, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Package,
  ArrowRight
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { QuickMessage } from './quick-message'

interface Quote {
  id: string
  description: string
  status: 'PENDING' | 'NEGOTIATING' | 'PRICE_PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED'
  budget?: number
  proposedPrice?: number
  finalPrice?: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  service: {
    id: string
    name: string
    slug: string
    price?: number
    pricingType?: string
    images?: { path: string; alt?: string }[]
  }
  messages: QuoteMessage[]
  _count: {
    messages: number
  }
}

interface QuoteMessage {
  id: string
  message: string
  proposedPrice?: number
  createdAt: string
  sender?: {
    id: string
    name: string
    role: string
  }
}

const statusConfig = {
  PENDING: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Clock,
    description: 'Votre demande est en cours d\'analyse'
  },
  NEGOTIATING: { 
    label: 'En discussion', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: MessageSquare,
    description: 'Échange en cours avec notre équipe'
  },
  PRICE_PROPOSED: { 
    label: 'Prix proposé', 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    icon: DollarSign,
    description: 'Un prix vous a été proposé'
  },
  ACCEPTED: { 
    label: 'Accepté', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    description: 'Devis accepté et ajouté au panier'
  },
  REJECTED: { 
    label: 'Rejeté', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    description: 'Devis décliné'
  },
  EXPIRED: { 
    label: 'Expiré', 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: Clock,
    description: 'Devis expiré'
  },
  COMPLETED: { 
    label: 'Terminé', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    description: 'Projet terminé'
  }
}

export function QuotesList() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    pending: 0,
    negotiating: 0,
    priceProposed: 0,
    accepted: 0,
    total: 0
  })

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/quotes')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des devis')
      }
      
      const data = await response.json()
      setQuotes(data)
      setError(null)
      
      // Calculer les statistiques
      const newStats = {
        pending: data.filter((q: Quote) => q.status === 'PENDING').length,
        negotiating: data.filter((q: Quote) => q.status === 'NEGOTIATING').length,
        priceProposed: data.filter((q: Quote) => q.status === 'PRICE_PROPOSED').length,
        accepted: data.filter((q: Quote) => q.status === 'ACCEPTED').length,
        total: data.length
      }
      setStats(newStats)
      
      toast({
        title: "Devis actualisés",
        description: `${data.length} devis chargés avec succès`,
      })
    } catch (err) {
      console.error('Erreur lors du chargement des devis:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      toast({
        title: "Erreur",
        description: "Impossible de charger les devis",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  // Filtrage et recherche
  useEffect(() => {
    let filtered = quotes

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter)
    }

    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredQuotes(filtered)
  }, [quotes, statusFilter, searchTerm])

  const getStatusDisplay = (quote: Quote) => {
    const config = statusConfig[quote.status]
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPriceDisplay = (quote: Quote) => {
    if (quote.finalPrice) {
      return <PriceWithConversion price={quote.finalPrice} />
    }
    if (quote.proposedPrice) {
      return <PriceWithConversion price={quote.proposedPrice} />
    }
    if (quote.budget) {
      return <span className="text-gray-500">Budget: <PriceWithConversion price={quote.budget} /></span>
    }
    return <span className="text-gray-500">À déterminer</span>
  }

  const getLastMessage = (quote: Quote) => {
    return quote.messages.length > 0 ? quote.messages[0] : null
  }

  const isClientMessage = (message: QuoteMessage) => {
    return message.sender?.role === 'USER'
  }

  const isAdminMessage = (message: QuoteMessage) => {
    return message.sender?.role === 'ADMIN' || message.sender?.role === 'STAFF'
  }

  const getActionButton = (quote: Quote) => {
    switch (quote.status) {
      case 'PENDING':
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-2" />
            En attente
          </Button>
        )
      case 'NEGOTIATING':
        return (
          <Button asChild variant="default" size="sm">
            <Link href={`/profile/quotes/${quote.id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Continuer
            </Link>
          </Button>
        )
      case 'PRICE_PROPOSED':
        return (
          <Button asChild variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Link href={`/profile/quotes/${quote.id}`}>
              <DollarSign className="h-4 w-4 mr-2" />
              Voir le prix
            </Link>
          </Button>
        )
      case 'ACCEPTED':
        return (
          <Button variant="outline" size="sm" disabled>
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepté
          </Button>
        )
      case 'REJECTED':
        return (
          <Button variant="outline" size="sm" disabled>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeté
          </Button>
        )
      case 'EXPIRED':
        return (
          <Button variant="outline" size="sm" disabled>
            <AlertCircle className="h-4 w-4 mr-2" />
            Expiré
          </Button>
        )
      case 'COMPLETED':
        return (
          <Button variant="outline" size="sm" disabled>
            <CheckCircle className="h-4 w-4 mr-2" />
            Terminé
          </Button>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement des devis...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="mt-2 text-red-700">{error}</p>
            <Button 
              onClick={fetchQuotes} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 px-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par service, description ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="NEGOTIATING">En discussion</SelectItem>
              <SelectItem value="PRICE_PROPOSED">Prix proposé</SelectItem>
              <SelectItem value="ACCEPTED">Accepté</SelectItem>
              <SelectItem value="REJECTED">Rejeté</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchQuotes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistiques rapides dans la section */}
      <div className="px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">En attente</span>
            </div>
            <div className="text-lg font-bold text-yellow-900">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">En discussion</span>
            </div>
            <div className="text-lg font-bold text-blue-900">{stats.negotiating}</div>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-800">Prix proposé</span>
            </div>
            <div className="text-lg font-bold text-purple-900">{stats.priceProposed}</div>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">Acceptés</span>
            </div>
            <div className="text-lg font-bold text-green-900">{stats.accepted}</div>
          </div>
        </div>
      </div>

      {/* Résumé des résultats */}
      <div className="flex items-center justify-between px-4">
        <p className="text-sm text-gray-600">
          {filteredQuotes.length} devis trouvé{filteredQuotes.length > 1 ? 's' : ''} 
          {statusFilter !== 'all' && ` • Filtre: ${statusConfig[statusFilter as keyof typeof statusConfig]?.label}`}
          {searchTerm && ` • Recherche: "${searchTerm}"`}
        </p>
      </div>

      {/* Liste des devis */}
      <div className="space-y-3 px-4 pb-4">
        {filteredQuotes.map((quote) => {
          const lastMessage = getLastMessage(quote)
          const hasUnreadAdmin = lastMessage && isAdminMessage(lastMessage) && quote.status === 'PRICE_PROPOSED'
          const config = statusConfig[quote.status]
          const canReply = quote.status === 'NEGOTIATING' || quote.status === 'PRICE_PROPOSED'
          
          // Définir la couleur de fond selon le statut
          const getBackgroundColor = (status: string) => {
            switch (status) {
              case 'PENDING':
                return 'bg-yellow-50/50'
              case 'NEGOTIATING':
                return 'bg-blue-50/50'
              case 'PRICE_PROPOSED':
                return 'bg-purple-50/50'
              case 'ACCEPTED':
                return 'bg-green-50/50'
              case 'REJECTED':
                return 'bg-red-50/50'
              case 'EXPIRED':
                return 'bg-gray-50/50'
              case 'COMPLETED':
                return 'bg-emerald-50/50'
              default:
                return 'bg-white'
            }
          }
          
          return (
            <Card 
              key={quote.id} 
              className={`transition-all hover:shadow-lg border-l-4 ${
                hasUnreadAdmin 
                  ? 'border-l-purple-500 bg-purple-50/30' 
                  : `border-l-${quote.status === 'PENDING' ? 'yellow' : quote.status === 'NEGOTIATING' ? 'blue' : quote.status === 'PRICE_PROPOSED' ? 'purple' : quote.status === 'ACCEPTED' ? 'green' : 'gray'}-500`
              } ${getBackgroundColor(quote.status)}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg text-gray-900">
                        {quote.service.name}
                      </CardTitle>
                      {hasUnreadAdmin && (
                        <Badge className="bg-purple-600 text-white animate-pulse text-xs">
                          Nouveau prix !
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      Devis #{quote.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {config.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusDisplay(quote)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {/* Informations prix */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium">Prix:</span>
                    </div>
                    <div className="pl-5">
                      <div className="font-semibold text-sm">
                        {getPriceDisplay(quote)}
                      </div>
                      {quote.finalPrice && quote.proposedPrice && quote.finalPrice !== quote.proposedPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          <PriceWithConversion price={quote.proposedPrice} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations messages */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium">Messages:</span>
                    </div>
                    <div className="pl-5">
                      <div className="text-sm font-semibold">
                        {quote._count.messages}
                      </div>
                      {lastMessage && (
                        <div className="text-xs text-gray-500">
                          {isAdminMessage(lastMessage) ? 'Équipe' : lastMessage.sender ? 'Vous' : 'Utilisateur'} • {formatDistanceToNow(new Date(lastMessage.createdAt), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations temporelles */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-600" />
                      <span className="text-xs font-medium">Créé:</span>
                    </div>
                    <div className="pl-5">
                      <div className="text-xs font-medium">
                        {format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(quote.createdAt), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-gray-600" />
                      <span className="text-xs font-medium">Actions:</span>
                    </div>
                    <div className="pl-5 flex flex-wrap gap-1">
                      {getActionButton(quote)}
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                        <Link href={`/profile/quotes/${quote.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dernier message */}
                {lastMessage && (
                  <div className={`p-3 rounded-lg mb-3 border-l-4 ${
                    isAdminMessage(lastMessage) 
                      ? 'border-l-blue-500 bg-blue-100/50' 
                      : 'border-l-green-500 bg-green-50/30'
                  }`}>
                    <div className="flex items-start gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {isAdminMessage(lastMessage) ? '👨‍💼' : '👤'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-900">
                            {isAdminMessage(lastMessage) ? 'Équipe BNK' : lastMessage.sender?.name || 'Vous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(lastMessage.createdAt), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {lastMessage.message}
                        </p>
                        {lastMessage.proposedPrice && (
                          <div className="mt-1">
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Prix proposé: <PriceWithConversion price={lastMessage.proposedPrice} />
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message rapide */}
                {canReply && (
                  <QuickMessage 
                    quoteId={quote.id} 
                    onMessageSent={fetchQuotes}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* État vide */}
      {filteredQuotes.length === 0 && !isLoading && (
        <div className="text-center py-8 px-4">
          <div className="max-w-md mx-auto">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Aucun devis trouvé' : 'Aucun devis pour le moment'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
                : 'Commencez par demander un devis pour un de nos services.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/services">
                  <Plus className="h-4 w-4 mr-2" />
                  Demander un devis
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 