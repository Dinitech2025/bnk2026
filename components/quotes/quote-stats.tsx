'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MessageSquare, DollarSign, CheckCircle } from 'lucide-react'

interface QuoteStatsData {
  pending: number
  negotiating: number
  priceProposed: number
  accepted: number
  total: number
}

export function QuoteStats() {
  const [stats, setStats] = useState<QuoteStatsData>({
    pending: 0,
    negotiating: 0,
    priceProposed: 0,
    accepted: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/quotes')
        if (response.ok) {
          const quotes = await response.json()
          const newStats = {
            pending: quotes.filter((q: any) => q.status === 'PENDING').length,
            negotiating: quotes.filter((q: any) => q.status === 'NEGOTIATING').length,
            priceProposed: quotes.filter((q: any) => q.status === 'PRICE_PROPOSED').length,
            accepted: quotes.filter((q: any) => q.status === 'ACCEPTED').length,
            total: quotes.length
          }
          setStats(newStats)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getPercentage = (value: number) => {
    return stats.total > 0 ? Math.round((value / stats.total) * 100) : 0
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <Card className="border-l-4 border-l-yellow-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">En attente</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          <div className="text-xs text-yellow-700">{getPercentage(stats.pending)}% du total</div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">En discussion</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.negotiating}</div>
          <div className="text-xs text-blue-700">{getPercentage(stats.negotiating)}% du total</div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Prix proposé</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.priceProposed}</div>
          <div className="text-xs text-purple-700">{getPercentage(stats.priceProposed)}% du total</div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Acceptés</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.accepted}</div>
          <div className="text-xs text-green-700">{getPercentage(stats.accepted)}% du total</div>
        </CardContent>
      </Card>
    </div>
  )
} 