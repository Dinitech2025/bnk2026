'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Download,
  Calendar,
  RefreshCw,
  Filter
} from 'lucide-react'
import { useCurrency } from '@/components/providers/currency-provider'
import { toast } from 'sonner'

interface SalesReport {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalItems: number
    revenueGrowth: string
    ordersGrowth: string
    currency: string
    period: {
      start: string
      end: string
      type: string
    }
  }
  salesData: Array<{
    period: string
    revenue: number
    orders: number
    items: number
  }>
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
    category: string
  }>
  categoryData: Array<{
    name: string
    revenue: number
    orders: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    revenue: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: string
    email: string
    total: number
    currency: string
    itemCount: number
    createdAt: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: '',
    groupBy: 'day',
    currency: 'MGA'
  })
  const { formatCurrency, formatWithTargetCurrency, targetCurrency, exchangeRates } = useCurrency()

  // Fonctions utilitaires pour la conversion et le formatage
  const convertPrice = (price: number, toCurrency: string = 'MGA') => {
    if (toCurrency === 'MGA') return price
    const rate = exchangeRates[toCurrency]
    return rate ? price / rate : price
  }

  const formatPrice = (price: number, currency: string = 'MGA') => {
    if (currency === 'MGA') return formatCurrency(price)
    return formatWithTargetCurrency(price, currency)
  }

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/admin/reports/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      } else {
        toast.error('Erreur lors du chargement du rapport')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement du rapport')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('format', format)

      const response = await fetch(`/api/admin/reports/sales/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rapport-ventes-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Rapport exporté en ${format.toUpperCase()}`)
      } else {
        toast.error('Erreur lors de l\'export')
      }
    } catch (error) {
      console.error('Erreur export:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change.startsWith('+') ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : change.startsWith('-') ? (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                ) : null}
                <span className={`text-sm ${
                  change.startsWith('+') ? 'text-green-600' : 
                  change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Génération du rapport...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Rapports de Ventes
          </h1>
          <p className="text-slate-600 mt-1">
            Analysez vos performances commerciales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={loadReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.period === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Grouper par</Label>
              <Select value={filters.groupBy} onValueChange={(value) => handleFilterChange('groupBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MGA">Ariary (MGA)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={loadReport}>
              Appliquer les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Chiffre d'affaires"
              value={formatPrice(convertPrice(report.summary.totalRevenue, report.summary.currency), targetCurrency || 'MGA')}
              change={report.summary.revenueGrowth}
              icon={DollarSign}
              color="bg-green-500"
            />
            <StatCard
              title="Commandes"
              value={report.summary.totalOrders.toLocaleString()}
              change={report.summary.ordersGrowth}
              icon={ShoppingBag}
              color="bg-blue-500"
            />
            <StatCard
              title="Panier moyen"
              value={formatPrice(convertPrice(report.summary.averageOrderValue, report.summary.currency), targetCurrency || 'MGA')}
              icon={Package}
              color="bg-purple-500"
            />
            <StatCard
              title="Articles vendus"
              value={report.summary.totalItems.toLocaleString()}
              icon={Users}
              color="bg-orange-500"
            />
          </div>

          {/* Graphiques et analyses */}
          <Tabs defaultValue="evolution" className="space-y-6">
            <TabsList>
              <TabsTrigger value="evolution">Évolution des ventes</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="orders">Commandes récentes</TabsTrigger>
            </TabsList>

            {/* Évolution des ventes */}
            <TabsContent value="evolution">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={report.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [
                          formatPrice(convertPrice(value, report.summary.currency), targetCurrency || 'MGA'),
                          'Chiffre d\'affaires'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top produits */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 des produits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {product.category} • {product.quantity} vendus
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(convertPrice(product.revenue, report.summary.currency), targetCurrency || 'MGA')}
                          </p>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Catégories */}
            <TabsContent value="categories">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={report.categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {report.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [
                            formatPrice(convertPrice(value, report.summary.currency), targetCurrency || 'MGA'),
                            'Chiffre d\'affaires'
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Détail par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.categoryData.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(convertPrice(category.revenue, report.summary.currency), targetCurrency || 'MGA')}
                            </p>
                            <p className="text-sm text-gray-600">{category.orders} commandes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Méthodes de paiement */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des paiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report.paymentMethods}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [
                          formatPrice(convertPrice(value, report.summary.currency), targetCurrency || 'MGA'),
                          'Montant'
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commandes récentes */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">#{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {order.customer} • {order.itemCount} articles
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(convertPrice(order.total, order.currency), targetCurrency || 'MGA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}