'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  Package, 
  FileText, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface DashboardStats {
  overview: {
    totalUsers: { value: number; change: string; trend: string }
    totalProducts: { value: number; change: string; trend: string }
    totalServices: { value: number; change: string; trend: string }
    totalOrders: { value: number; change: string; trend: string }
    totalRevenue: { value: number; change: string; trend: string }
    pendingOrders: { value: number; change: string; trend: string }
  }
  alerts: {
    lowStockProducts: number
    pendingOrders: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: string
    email: string
    total: number
    status: string
    paymentStatus: string
    createdAt: string
  }>
  monthlyStats: Array<{
    month: string
    orders: number
    revenue: number
  }>
}

function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  isRevenue = false 
}: { 
  title: string
  value: number | string
  change: string
  trend: string
  icon: React.ReactNode
  isRevenue?: boolean
}) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              {isRevenue ? (
                <PriceWithConversion 
                  price={Number(value)} 
                  className="text-2xl font-bold text-gray-900"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
              )}
              <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{change}</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertCard({ 
  title, 
  count, 
  description, 
  action, 
  variant = 'default' 
}: {
  title: string
  count: number
  description: string
  action: { text: string; href: string }
  variant?: 'default' | 'warning' | 'danger'
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'danger':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <Card className={`${getVariantStyles()} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <Link href={action.href}>
            <Button variant="outline" size="sm">
              {action.text}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Données de fallback si l'API échoue
        console.warn('API failed, using fallback data')
        setStats({
          overview: {
            totalUsers: { value: 0, change: '+0%', trend: 'neutral' },
            totalProducts: { value: 0, change: '+0%', trend: 'neutral' },
            totalServices: { value: 0, change: '+0%', trend: 'neutral' },
            totalOrders: { value: 0, change: '+0%', trend: 'neutral' },
            totalRevenue: { value: 0, change: '+0%', trend: 'neutral' },
            pendingOrders: { value: 0, change: 'Normal', trend: 'neutral' }
          },
          alerts: {
            lowStockProducts: 0,
            pendingOrders: 0
          },
          recentOrders: [],
          monthlyStats: [
            { month: '2024-10-01', orders: 0, revenue: 0 },
            { month: '2024-09-01', orders: 0, revenue: 0 },
            { month: '2024-08-01', orders: 0, revenue: 0 },
            { month: '2024-07-01', orders: 0, revenue: 0 },
            { month: '2024-06-01', orders: 0, revenue: 0 },
            { month: '2024-05-01', orders: 0, revenue: 0 }
          ]
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // Données de fallback en cas d'erreur
      setStats({
        overview: {
          totalUsers: { value: 0, change: '+0%', trend: 'neutral' },
          totalProducts: { value: 0, change: '+0%', trend: 'neutral' },
          totalServices: { value: 0, change: '+0%', trend: 'neutral' },
          totalOrders: { value: 0, change: '+0%', trend: 'neutral' },
          totalRevenue: { value: 0, change: '+0%', trend: 'neutral' },
          pendingOrders: { value: 0, change: 'Normal', trend: 'neutral' }
        },
        alerts: {
          lowStockProducts: 0,
          pendingOrders: 0
        },
        recentOrders: [],
        monthlyStats: []
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les statistiques du dashboard
          </p>
          <Button onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  // Préparer les données pour les graphiques
  const chartData = stats.monthlyStats.map(stat => ({
    month: new Date(stat.month).toLocaleDateString('fr-FR', { month: 'short' }),
    commandes: stat.orders,
    revenus: stat.revenue
  })).reverse()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Utilisateurs"
          value={stats.overview.totalUsers.value}
          change={stats.overview.totalUsers.change}
          trend={stats.overview.totalUsers.trend}
          icon={<Users className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Produits"
          value={stats.overview.totalProducts.value}
          change={stats.overview.totalProducts.change}
          trend={stats.overview.totalProducts.trend}
          icon={<ShoppingBag className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Services"
          value={stats.overview.totalServices.value}
          change={stats.overview.totalServices.change}
          trend={stats.overview.totalServices.trend}
          icon={<Package className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Commandes"
          value={stats.overview.totalOrders.value}
          change={stats.overview.totalOrders.change}
          trend={stats.overview.totalOrders.trend}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Revenus"
          value={stats.overview.totalRevenue.value}
          change={stats.overview.totalRevenue.change}
          trend={stats.overview.totalRevenue.trend}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          isRevenue={true}
        />
        <StatCard
          title="En attente"
          value={stats.overview.pendingOrders.value}
          change={stats.overview.pendingOrders.change}
          trend={stats.overview.pendingOrders.trend}
          icon={<Clock className="h-6 w-6 text-blue-600" />}
        />
      </div>

      {/* Alertes */}
      {(stats.alerts.lowStockProducts > 0 || stats.alerts.pendingOrders > 5) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Alertes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.alerts.lowStockProducts > 0 && (
              <AlertCard
                title="Stock faible"
                count={stats.alerts.lowStockProducts}
                description="Produits avec moins de 10 unités"
                action={{ text: "Voir l'inventaire", href: "/admin/products/inventory" }}
                variant="warning"
              />
            )}
            {stats.alerts.pendingOrders > 5 && (
              <AlertCard
                title="Commandes en attente"
                count={stats.alerts.pendingOrders}
                description="Commandes nécessitant votre attention"
                action={{ text: "Voir les commandes", href: "/admin/orders" }}
                variant="danger"
              />
            )}
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des revenus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution des revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [
                      new Intl.NumberFormat('mg-MG').format(value) + ' Ar',
                      'Revenus'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenus" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Graphique des commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Commandes par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="commandes" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dernières commandes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dernières commandes
            </CardTitle>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                    <Badge variant={order.paymentStatus === 'COMPLETED' ? 'default' : 'destructive'}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.customer} • {order.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <PriceWithConversion 
                    price={order.total} 
                    className="font-semibold text-gray-900"
                  />
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="ghost" size="sm" className="mt-1">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}