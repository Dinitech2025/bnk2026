'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Settings, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2,
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  Shield,
  Activity,
  TrendingUp,
  Users,
  MapPin,
  Globe,
  Zap,
  Filter,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { PaymentMethodForm } from '@/components/admin/payment-methods/payment-method-form'
import { PaymentProviderForm } from '@/components/admin/payment-methods/payment-provider-form'
import { BankMethodForm } from '@/components/admin/payment-methods/bank-method-form'
import { CashMethodForm } from '@/components/admin/payment-methods/cash-method-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PaymentMethod {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  type: string
  isActive: boolean
  order: number
  minAmount: number | null
  maxAmount: number | null
  feeType: string | null
  feeValue: number | null
  processingTime: string | null
  requiresReference: boolean
  requiresTransactionId: boolean
  allowPartialPayments: boolean
  apiEnabled: boolean
  apiEndpoint: string | null
  publicKey: string | null
  providers: PaymentProvider[]
  _count?: { payments: number }
}

interface PaymentProvider {
  id: string
  code: string
  name: string
  description: string | null
  logo: string | null
  isActive: boolean
  order: number
  feeType: string | null
  feeValue: number | null
  minAmount: number | null
  maxAmount: number | null
  dailyLimit: number | null
  apiEndpoint: string | null
  publicKey: string | null
  merchantId: string | null
  paymentMethod?: {
    id: string
    name: string
    code: string
  }
}

interface PaymentProviderWithMethod extends PaymentProvider {
  paymentMethod?: {
    id: string
    name: string
    code: string
  }
}

const iconMap: Record<string, any> = {
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  Globe,
  Shield
}

export default function ModernPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [showCashForm, setShowCashForm] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [selectedMethodForProvider, setSelectedMethodForProvider] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'method' | 'provider', id: string } | null>(null)

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setPaymentMethods(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des méthodes de paiement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const toggleMethodStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      await fetchPaymentMethods()
      toast.success(`Méthode ${!isActive ? 'activée' : 'désactivée'}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const toggleProviderStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      await fetchPaymentMethods()
      toast.success(`Fournisseur ${!isActive ? 'activé' : 'désactivé'}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      if (deleteConfirm.type === 'method') {
        const method = paymentMethods.find(m => m.id === deleteConfirm.id)
        if (method?.code === 'online_payment') {
          toast.error('La méthode "Paiement en ligne" ne peut pas être supprimée car elle est essentielle au système')
          setDeleteConfirm(null)
          return
        }
      }

      const url = deleteConfirm.type === 'method' 
        ? `/api/admin/payment-methods/${deleteConfirm.id}`
        : `/api/admin/payment-providers/${deleteConfirm.id}`

      const response = await fetch(url, { method: 'DELETE' })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      await fetchPaymentMethods()
      toast.success(`${deleteConfirm.type === 'method' ? 'Méthode' : 'Fournisseur'} supprimé(e) avec succès`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('mg-MG').format(amount) + ' Ar'
  }

  const formatFee = (feeType: string | null, feeValue: number | null) => {
    if (!feeType || !feeValue || feeType === 'NONE') return 'Gratuit'
    if (feeType === 'PERCENTAGE') return `${feeValue}%`
    if (feeType === 'FIXED') return formatAmount(feeValue)
    return '-'
  }

  const getIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return CreditCard
    return iconMap[iconName]
  }

  // Statistiques pour le dashboard
  const getStats = () => {
    const totalMethods = paymentMethods.length
    const activeMethods = paymentMethods.filter(m => m.isActive).length
    const totalProviders = paymentMethods.reduce((acc, method) => acc + method.providers.length, 0)
    const activeProviders = paymentMethods.reduce((acc, method) => 
      acc + method.providers.filter(p => p.isActive).length, 0)
    
    return { totalMethods, activeMethods, totalProviders, activeProviders }
  }

  const stats = getStats()

  // Filtrage des méthodes
  const getOnlinePaymentProviders = () => {
    return paymentMethods.flatMap(method => 
      method.providers.filter(provider =>
        method.code === 'online_payment' &&
        (searchTerm === '' || 
         provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         provider.code.toLowerCase().includes(searchTerm.toLowerCase()))
      ).map(provider => ({
        ...provider,
        paymentMethod: { id: method.id, name: method.name, code: method.code }
      }))
    )
  }

  const getMobileMoneyProviders = () => {
    return paymentMethods.flatMap(method => 
      method.providers.filter(provider =>
        method.code === 'mobile_money' &&
        (searchTerm === '' || 
         provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         provider.code.toLowerCase().includes(searchTerm.toLowerCase()))
      ).map(provider => ({
        ...provider,
        paymentMethod: { id: method.id, name: method.name, code: method.code }
      }))
    )
  }

  const getBankTransferMethods = () => {
    return paymentMethods.filter(method => 
      (method.name.toLowerCase().includes('bank') || 
       method.name.toLowerCase().includes('virement') ||
       method.code.includes('bank')) &&
      (searchTerm === '' || 
       method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       method.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const getCashPaymentMethods = () => {
    return paymentMethods.filter(method => 
      (method.name.toLowerCase().includes('espèce') || 
       method.name.toLowerCase().includes('cash') ||
       method.code.includes('cash')) &&
      (searchTerm === '' || 
       method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       method.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const getMethodIdForTab = (tab: string): string | null => {
    switch (tab) {
      case 'online':
        return paymentMethods.find(m => m.code === 'online_payment')?.id || null
      case 'mobile':
        return paymentMethods.find(m => m.code === 'mobile_money')?.id || null
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header moderne */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Paramètres de Paiement
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Gérez vos méthodes et fournisseurs de paiement en toute simplicité
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Onglets modernes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
<TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Globe className="h-4 w-4 mr-2" />
                En ligne
              </TabsTrigger>
              <TabsTrigger value="mobile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile Money
              </TabsTrigger>
              <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Building className="h-4 w-4 mr-2" />
                Banques
              </TabsTrigger>
              <TabsTrigger value="cash" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Banknote className="h-4 w-4 mr-2" />
                Espèces
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Onglet Paiement en ligne */}
          <TabsContent value="online" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      Fournisseurs de Paiement en Ligne
                    </CardTitle>
                    <p className="text-slate-600 mt-1">PayPal, Stripe, Google Pay, Apple Pay, etc.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedProvider(null)
                      setSelectedMethodForProvider(getMethodIdForTab('online'))
                      setShowProviderForm(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getOnlinePaymentProviders().length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun fournisseur configuré</h3>
                    <p className="text-slate-600 mb-6">Ajoutez des fournisseurs comme PayPal, Stripe, ou Google Pay</p>
                    <Button 
                      onClick={() => {
                        setSelectedProvider(null)
                        setSelectedMethodForProvider(getMethodIdForTab('online'))
                        setShowProviderForm(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un fournisseur
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getOnlinePaymentProviders().map((provider) => {
                      const IconComponent = getIcon(provider.logo)
                      const isPayPal = provider.code === 'paypal'
                      
                      return (
                        <div key={provider.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${isPayPal ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${
                              provider.isActive 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{provider.name}</h4>
                                {isPayPal && (
                                  <Badge className="bg-blue-600 text-white">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Essentiel
                                  </Badge>
                                )}
                                <Badge variant={provider.isActive ? "default" : "secondary"}>
                                  {provider.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <code className="bg-slate-100 px-2 py-1 rounded text-xs">{provider.code}</code>
                                <span>•</span>
                                <span>Frais: {formatFee(provider.feeType, provider.feeValue)}</span>
                                {provider.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-xs">{provider.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                              className="h-9 w-9 p-0"
                            >
                              {provider.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProvider(provider)
                                setShowProviderForm(true)
                              }}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {!isPayPal && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type: 'provider', id: provider.id })}
                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Mobile Money */}
          <TabsContent value="mobile" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-orange-500" />
                      Fournisseurs Mobile Money
                    </CardTitle>
                    <p className="text-slate-600 mt-1">Orange Money, Airtel Money, MVola, Telma Money, etc.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedProvider(null)
                      setSelectedMethodForProvider(getMethodIdForTab('mobile'))
                      setShowProviderForm(true)
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getMobileMoneyProviders().length === 0 ? (
                  <div className="text-center py-12">
                    <Smartphone className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun fournisseur Mobile Money</h3>
                    <p className="text-slate-600 mb-6">Ajoutez des fournisseurs comme Orange Money, Airtel Money, MVola</p>
                    <Button 
                      onClick={() => {
                        setSelectedProvider(null)
                        setSelectedMethodForProvider(getMethodIdForTab('mobile'))
                        setShowProviderForm(true)
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un fournisseur
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getMobileMoneyProviders().map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            provider.isActive 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900">{provider.name}</h4>
                              <Badge variant={provider.isActive ? "default" : "secondary"}>
                                {provider.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                              <code className="bg-slate-100 px-2 py-1 rounded text-xs">{provider.code}</code>
                              <span>•</span>
                              <span>Frais: {formatFee(provider.feeType, provider.feeValue)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                            className="h-9 w-9 p-0"
                          >
                            {provider.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(provider)
                              setShowProviderForm(true)
                            }}
                            className="h-9 w-9 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ type: 'provider', id: provider.id })}
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Banques */}
          <TabsContent value="bank" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-green-500" />
                      Banques Partenaires
                    </CardTitle>
                    <p className="text-slate-600 mt-1">BMOI, BNI, BOA, Banky Fampandrosoana, etc.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedMethod(null)
                      setShowBankForm(true)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getBankTransferMethods().length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune banque configurée</h3>
                    <p className="text-slate-600 mb-6">Ajoutez des banques comme BMOI, BNI, BOA avec leurs informations</p>
                    <Button 
                      onClick={() => setShowBankForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une banque
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getBankTransferMethods().map((method) => {
                      const IconComponent = getIcon(method.icon)
                      return (
                        <div key={method.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${
                              method.isActive 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{method.name}</h4>
                                <Badge variant={method.isActive ? "default" : "secondary"}>
                                  {method.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <code className="bg-slate-100 px-2 py-1 rounded text-xs">{method.code}</code>
                                <span>•</span>
                                <span>Frais: {formatFee(method.feeType, method.feeValue)}</span>
                                <span>•</span>
                                <span>{method.processingTime || '1-3 jours'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMethodStatus(method.id, method.isActive)}
                              className="h-9 w-9 p-0"
                            >
                              {method.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMethod(method)
                                setShowBankForm(true)
                              }}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ type: 'method', id: method.id })}
                              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Espèces */}
          <TabsContent value="cash" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-yellow-500" />
                      Points de Paiement Espèce
                    </CardTitle>
                    <p className="text-slate-600 mt-1">Magasins, agences, bureaux de change, etc.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedMethod(null)
                      setShowCashForm(true)
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getCashPaymentMethods().length === 0 ? (
                  <div className="text-center py-12">
                    <Banknote className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun point de paiement</h3>
                    <p className="text-slate-600 mb-6">Ajoutez des points de paiement avec leurs adresses exactes</p>
                    <Button 
                      onClick={() => setShowCashForm(true)}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un point
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getCashPaymentMethods().map((method) => {
                      const IconComponent = getIcon(method.icon)
                      return (
                        <div key={method.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${
                              method.isActive 
                                ? 'bg-yellow-100 text-yellow-600' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{method.name}</h4>
                                <Badge variant={method.isActive ? "default" : "secondary"}>
                                  {method.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <code className="bg-slate-100 px-2 py-1 rounded text-xs">{method.code}</code>
                                <span>•</span>
                                <span>Frais: {formatFee(method.feeType, method.feeValue)}</span>
                                {method.apiEndpoint && (
                                  <>
                                    <span>•</span>
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-xs">{method.apiEndpoint}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMethodStatus(method.id, method.isActive)}
                              className="h-9 w-9 p-0"
                            >
                              {method.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMethod(method)
                                setShowCashForm(true)
                              }}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ type: 'method', id: method.id })}
                              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Formulaires modaux */}
      <PaymentMethodForm
        isOpen={showMethodForm}
        onClose={() => {
          setShowMethodForm(false)
          setSelectedMethod(null)
        }}
        method={selectedMethod}
        onSuccess={fetchPaymentMethods}
      />

      <PaymentProviderForm
        isOpen={showProviderForm}
        onClose={() => {
          setShowProviderForm(false)
          setSelectedProvider(null)
          setSelectedMethodForProvider(null)
        }}
        provider={selectedProvider}
        methodId={selectedMethodForProvider}
        onSuccess={fetchPaymentMethods}
      />

      <BankMethodForm
        isOpen={showBankForm}
        onClose={() => {
          setShowBankForm(false)
          setSelectedMethod(null)
        }}
        method={selectedMethod}
        onSuccess={fetchPaymentMethods}
      />

      <CashMethodForm
        isOpen={showCashForm}
        onClose={() => {
          setShowCashForm(false)
          setSelectedMethod(null)
        }}
        method={selectedMethod}
        onSuccess={fetchPaymentMethods}
      />

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Supprimer ${deleteConfirm?.type === 'method' ? 'la méthode' : 'le fournisseur'}`}
        description={`Êtes-vous sûr de vouloir supprimer ${deleteConfirm?.type === 'method' ? 'cette méthode de paiement' : 'ce fournisseur'} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  )
}
