'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { MessageSquare, TrendingUp, Clock, DollarSign, Eye, User, Calendar, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

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
  }
  service: {
    id: string
    name: string
    slug: string
    price: number | null
    pricingType: string
  } | null
  product: {
    id: string
    name: string
    slug: string
    price: number | null
    pricingType: string
  } | null
  messages: Array<{
    id: string
    message: string
    createdAt: string
  }>
  _count: {
    messages: number
  }
}

interface Statistics {
  total: number
  pending: number
  negotiating: number
  priceProposed: number
  accepted: number
  rejected: number
  totalValueThisMonth: number
  acceptedThisMonth: number
}

interface ApiResponse {
  quotes: Quote[]
  statistics: Statistics
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const statusLabels = {
  PENDING: 'En attente',
  NEGOTIATING: 'En négociation',
  PRICE_PROPOSED: 'Prix proposé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Rejeté',
  EXPIRED: 'Expiré'
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  NEGOTIATING: 'bg-blue-100 text-blue-800',
  PRICE_PROPOSED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800'
}

// Fonction utilitaire pour s'assurer qu'une valeur est un nombre
const safeNumber = (value: any): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (value && typeof value === 'object' && 'id' in value) return value.id || 0
  return 0
}

// Fonction utilitaire pour s'assurer qu'une valeur est une chaîne
const safeString = (value: any): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (value && typeof value === 'object') return JSON.stringify(value)
  return ''
}

export default function AdminQuotesPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        console.log('🔍 Récupération des devis...')
        const response = await fetch('/api/admin/quotes')
        console.log('📡 Réponse API:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Erreur API:', errorText)
          throw new Error(`Erreur ${response.status}: ${errorText}`)
        }
        
        const result = await response.json()
        console.log('📊 Données reçues:', result)
        
        // Nettoyer les données pour éviter les erreurs d'objet React
        const cleanedResult = {
          ...result,
          statistics: {
            total: safeNumber(result.statistics?.total),
            pending: safeNumber(result.statistics?.pending),
            negotiating: safeNumber(result.statistics?.negotiating),
            priceProposed: safeNumber(result.statistics?.priceProposed),
            accepted: safeNumber(result.statistics?.accepted),
            rejected: safeNumber(result.statistics?.rejected),
            totalValueThisMonth: safeNumber(result.statistics?.totalValueThisMonth),
            acceptedThisMonth: safeNumber(result.statistics?.acceptedThisMonth)
          }
        }
        
        setData(cleanedResult)
      } catch (err) {
        console.error('❌ Erreur lors de la récupération:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des devis</h1>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des devis</h1>
          <p className="text-red-600 mt-2">Erreur: {error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des devis</h1>
          <p className="text-gray-600 mt-2">Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  const { quotes, statistics } = data
  const conversionRate = statistics.total > 0 ? Math.round((statistics.accepted / statistics.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Gestion des devis</h1>
        <p className="text-gray-600 mt-2">
          Gérez toutes les demandes de devis clients et suivez leur progression
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total devis</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pending} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending + statistics.negotiating}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une réponse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.accepted}</div>
            <p className="text-xs text-muted-foreground">
              Taux de conversion: {conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><PriceWithConversion price={statistics.totalValueThisMonth} /></div>
            <p className="text-xs text-muted-foreground">
              {statistics.acceptedThisMonth} devis acceptés ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des devis */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de devis</CardTitle>
          <CardDescription>
            Gérez les demandes de devis clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!quotes || quotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun devis</h3>
              <p className="text-gray-600">
                Les demandes de devis apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={statusColors[quote.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[quote.status as keyof typeof statusLabels] || quote.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {safeNumber(quote._count?.messages)} message{safeNumber(quote._count?.messages) > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1">
                        {safeString(quote.service?.name || quote.product?.name)}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({quote.service ? 'Service' : 'Produit'})
                        </span>
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{safeString(quote.user?.name || quote.user?.email)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">{safeString(quote.description)}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        {quote.budget && (
                          <span className="text-gray-600">
                            Budget: <span className="font-semibold"><PriceWithConversion price={safeNumber(quote.budget)} /></span>
                          </span>
                        )}
                        {quote.proposedPrice && (
                          <span className="text-blue-600">
                            Prix proposé: <span className="font-semibold"><PriceWithConversion price={safeNumber(quote.proposedPrice)} /></span>
                          </span>
                        )}
                        {quote.finalPrice && (
                          <span className="text-green-600">
                            Prix final: <span className="font-semibold"><PriceWithConversion price={safeNumber(quote.finalPrice)} /></span>
                          </span>
                        )}
                        {quote.negotiationType && quote.negotiationType === 'PRODUCT_PRICE' && (
                          <Badge variant="outline" className="text-xs">
                            Négociation produit
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/quotes/${quote.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 