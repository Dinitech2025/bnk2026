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
  DollarSign,
  Users,
  Activity,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MoreVertical,
  Download,
  Upload,
  MapPin
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
  _count?: { payments: number }
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
  DollarSign,
  Users
}

export default function PaymentMethodsPageOptimized() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('online')
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [showCashForm, setShowCashForm] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [selectedMethodForProvider, setSelectedMethodForProvider] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'method' | 'provider', id: string } | null>(null)

  // Fonction pour obtenir l'ID de méthode selon l'onglet actuel
  const getMethodIdForTab = (tab: string): string | null => {
    switch (tab) {
      case 'online':
        return paymentMethods.find(m => m.code === 'online_payment')?.id || null
      case 'mobile':
        // Pour mobile money, on peut créer une méthode générique ou utiliser une existante
        return paymentMethods.find(m => m.code === 'mobile_money')?.id || null
      case 'bank':
        // Pour virement bancaire, chaque banque est une méthode séparée
        return null
      case 'cash':
        // Pour paiement espèce, chaque point est une méthode séparée
        return null
      default:
        return null
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setPaymentMethods(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des méthodes de paiement')
      console.error(error)
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
      toast.success(`Méthode ${!isActive ? 'activée' : 'désactivée'} avec succès`)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
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
      toast.success(`Fournisseur ${!isActive ? 'activé' : 'désactivé'} avec succès`)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      // Vérifier si c'est la méthode PayPal "Paiement en ligne"
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

  // Fonctions pour filtrer les fournisseurs par type
  const getOnlinePaymentProviders = () => {
    return paymentMethods.flatMap(method => 
      method.providers.filter(provider =>
        method.code === 'online_payment' ||
        provider.name.toLowerCase().includes('paypal') ||
        provider.name.toLowerCase().includes('stripe') ||
        provider.name.toLowerCase().includes('google') ||
        provider.name.toLowerCase().includes('apple') ||
        provider.name.toLowerCase().includes('carte') ||
        provider.code.toLowerCase().includes('paypal') ||
        provider.code.toLowerCase().includes('stripe') ||
        provider.code.toLowerCase().includes('card')
      ).map(provider => ({
        ...provider,
        paymentMethod: { id: method.id, name: method.name, code: method.code }
      }))
    )
  }

  const getMobileMoneyProviders = () => {
    return paymentMethods.flatMap(method => 
      method.providers.filter(provider =>
        provider.name.toLowerCase().includes('orange') ||
        provider.name.toLowerCase().includes('airtel') ||
        provider.name.toLowerCase().includes('mvola') ||
        provider.name.toLowerCase().includes('telma') ||
        provider.name.toLowerCase().includes('mobile') ||
        provider.code.toLowerCase().includes('orange') ||
        provider.code.toLowerCase().includes('airtel') ||
        provider.code.toLowerCase().includes('mvola')
      ).map(provider => ({
        ...provider,
        paymentMethod: { id: method.id, name: method.name, code: method.code }
      }))
    )
  }

  const getBankTransferMethods = () => {
    return paymentMethods.filter(method => 
      method.name.toLowerCase().includes('virement') ||
      method.name.toLowerCase().includes('banque') ||
      method.name.toLowerCase().includes('bancaire') ||
      method.name.toLowerCase().includes('transfer')
    )
  }

  const getCashPaymentMethods = () => {
    return paymentMethods.filter(method => 
      method.name.toLowerCase().includes('espèce') ||
      method.name.toLowerCase().includes('cash') ||
      method.name.toLowerCase().includes('liquide') ||
      method.name.toLowerCase().includes('comptant')
    )
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des méthodes de paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* En-tête simple */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configuration des Paiements</h1>
          <p className="text-gray-600 mt-1">
            Gérez les méthodes de paiement et leurs fournisseurs
          </p>
          
          {/* Guide rapide */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Guide rapide :</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
              <div>
                <strong>🏷️ Méthodes de paiement :</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Paiement en ligne (PayPal, Stripe...)</li>
                  <li>• Mobile Money (Orange, Airtel...)</li>
                  <li>• Virement bancaire (BMOI, BNI...)</li>
                  <li>• Paiement espèce (Points de vente)</li>
                </ul>
              </div>
              <div>
                <strong>🏪 Fournisseurs :</strong>
                <ul className="mt-1 space-y-1">
                  <li>• PayPal, Stripe → Paiement en ligne</li>
                  <li>• Orange Money, MVola → Mobile Money</li>
                  <li>• Chaque banque → Méthode séparée</li>
                  <li>• Chaque point → Méthode séparée</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="online" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Paiement en ligne
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Money
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Virement bancaire
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Paiement espèce
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowMethodForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle méthode
            </Button>
          </div>
        </div>

        {/* Onglet Paiement en ligne */}
        <TabsContent value="online" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Fournisseurs de paiement en ligne</h3>
              <p className="text-sm text-gray-600">PayPal, Stripe, Google Pay, Apple Pay, etc.</p>
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
              Ajouter un fournisseur
            </Button>
          </div>
          
          {getOnlinePaymentProviders().length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur de paiement en ligne configuré</h3>
                <p className="text-gray-600 mb-4">Ajoutez des fournisseurs comme PayPal, Stripe, ou Google Pay</p>
                <Button onClick={() => {
                  setSelectedProvider(null)
                  setSelectedMethodForProvider(getMethodIdForTab('online'))
                  setShowProviderForm(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un fournisseur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {getOnlinePaymentProviders().map((provider) => {
                const IconComponent = getIcon(provider.logo)
                const isPayPal = provider.code === 'paypal'
                
                return (
                  <div key={provider.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm ${isPayPal ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                    {/* Informations principales */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded ${
                        provider.isActive 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{provider.name}</h4>
                          {isPayPal && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Essentiel
                            </Badge>
                          )}
                          <Badge variant={provider.isActive ? "default" : "secondary"} className="text-xs">
                            {provider.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-gray-100 px-1 rounded text-xs">{provider.code}</code>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-600">Frais: {formatFee(provider.feeType, provider.feeValue)}</span>
                          {provider.description && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-600 truncate max-w-xs">{provider.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                        className="h-8 w-8 p-0"
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
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!isPayPal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'provider', id: provider.id })}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </TabsContent>

        {/* Onglet Mobile Money */}
        <TabsContent value="mobile" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Fournisseurs Mobile Money</h3>
              <p className="text-sm text-gray-600">Orange Money, Airtel Money, MVola, Telma Money, etc.</p>
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
              Ajouter un fournisseur
            </Button>
          </div>
          
          {getMobileMoneyProviders().length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur Mobile Money configuré</h3>
                <p className="text-gray-600 mb-4">Ajoutez des fournisseurs comme Orange Money, Airtel Money, MVola</p>
                <Button onClick={() => {
                  setSelectedProvider(null)
                  setSelectedMethodForProvider(getMethodIdForTab('mobile'))
                  setShowProviderForm(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un fournisseur
                </Button>
              </CardContent>
            </Card>
          ) : (
            getMobileMoneyProviders().map((provider) => {
              
              return (
                <Card key={provider.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {provider.logo ? (
                          <img 
                            src={provider.logo} 
                            alt={provider.name}
                            className="h-10 w-10 object-contain rounded"
                          />
                        ) : (
                          <div className={`p-2 rounded-lg ${
                            provider.isActive 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Smartphone className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {provider.name}
                            <Badge variant={provider.isActive ? "default" : "secondary"}>
                              {provider.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                            {provider._count?.payments && provider._count.payments > 0 && (
                              <Badge variant="outline">
                                {provider._count.payments} paiement(s)
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-gray-100 px-1 rounded text-xs">{provider.code}</code>
                            <Badge variant="outline" className="text-xs">
                              📱 Mobile Money
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Méthode: {provider.paymentMethod?.name}
                            </span>
                          </div>
                          {provider.description && (
                            <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                          )}
                          
                          {/* Informations du fournisseur Mobile Money */}
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              Informations du fournisseur
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Nom du fournisseur:</span>
                                <p className="text-gray-900">{provider.name}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Code fournisseur:</span>
                                <p className="text-gray-900 font-mono">{provider.code}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Numéro marchand:</span>
                                <p className="text-gray-900 font-mono">
                                  {provider.publicKey || 'À configurer'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">API Endpoint:</span>
                                <p className="text-gray-900 text-xs">
                                  {provider.apiEndpoint || 'À configurer'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Frais de transaction:</span>
                                <p className="text-gray-900">
                                  {formatFee(provider.feeType, provider.feeValue)}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Limite journalière:</span>
                                <p className="text-gray-900">
                                  {provider.dailyLimit ? formatAmount(provider.dailyLimit) : 'Aucune limite'}
                                </p>
                              </div>
                              {provider.minAmount && (
                                <div>
                                  <span className="font-medium text-gray-700">Montant minimum:</span>
                                  <p className="text-gray-900">{formatAmount(provider.minAmount)}</p>
                                </div>
                              )}
                              {provider.maxAmount && (
                                <div>
                                  <span className="font-medium text-gray-700">Montant maximum:</span>
                                  <p className="text-gray-900">{formatAmount(provider.maxAmount)}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Instructions pour le client */}
                            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                              <h5 className="font-medium text-blue-800 text-xs mb-1">Instructions pour le client:</h5>
                              <p className="text-blue-700 text-xs">
                                Composez le code USSD ou utilisez l'application mobile {provider.name} pour effectuer le paiement.
                                Vous recevrez un SMS de confirmation après le paiement.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                        >
                          {provider.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider(provider)
                            setSelectedMethodForProvider(provider.paymentMethod?.id || null)
                            setShowProviderForm(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'provider', id: provider.id })}
                          disabled={provider._count?.payments && provider._count.payments > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Onglet Virement bancaire */}
        <TabsContent value="bank" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Banques partenaires</h3>
              <p className="text-sm text-gray-600">BMOI, BNI, BOA, Banky Fampandrosoana, etc.</p>
            </div>
            <Button 
              onClick={() => {
                setSelectedMethod(null)
                setShowBankForm(true)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une banque
            </Button>
          </div>
          
          {getBankTransferMethods().length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun virement bancaire configuré</h3>
                <p className="text-gray-600 mb-4">Ajoutez des banques comme BMOI, BNI, BOA avec leurs informations</p>
                <Button onClick={() => setShowBankForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une banque
                </Button>
              </CardContent>
            </Card>
          ) : (
            getBankTransferMethods().map((method) => {
              const IconComponent = getIcon(method.icon)
              
              return (
                <Card key={method.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          method.isActive 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {method.name}
                            <Badge variant={method.isActive ? "default" : "secondary"}>
                              {method.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                            {method._count?.payments && method._count.payments > 0 && (
                              <Badge variant="outline">
                                {method._count.payments} paiement(s)
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-gray-100 px-1 rounded text-xs">{method.code}</code>
                            <Badge variant="outline" className="text-xs">
                              🏦 Virement bancaire
                            </Badge>
                          </div>
                          {method.description && (
                            <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                          )}
                          
                          {/* Informations bancaires détaillées */}
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Informations bancaires
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Nom de la banque:</span>
                                <p className="text-gray-900">{method.name}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Code banque:</span>
                                <p className="text-gray-900 font-mono">{method.code}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">RIB/IBAN:</span>
                                <p className="text-gray-900 font-mono">
                                  {method.publicKey || 'À configurer'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Nom du titulaire:</span>
                                <p className="text-gray-900">
                                  BOUTIK NAKA
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Adresse agence:</span>
                                <p className="text-gray-900">
                                  {method.apiEndpoint || 'À configurer'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Frais de virement:</span>
                                <p className="text-gray-900">
                                  {formatFee(method.feeType, method.feeValue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMethodStatus(method.id, method.isActive)}
                        >
                          {method.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMethod(method)
                            setShowMethodForm(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'method', id: method.id })}
                          disabled={method._count?.payments && method._count.payments > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Onglet Paiement espèce */}
        <TabsContent value="cash" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Points de paiement espèce</h3>
              <p className="text-sm text-gray-600">Magasins, agences, bureaux de change, etc.</p>
            </div>
            <Button 
              onClick={() => {
                setSelectedMethod(null)
                setShowCashForm(true)
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un point de paiement
            </Button>
          </div>
          
          {getCashPaymentMethods().length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun point de paiement espèce configuré</h3>
                <p className="text-gray-600 mb-4">Ajoutez des points de paiement avec leurs adresses exactes</p>
                <Button onClick={() => setShowCashForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un point de paiement
                </Button>
              </CardContent>
            </Card>
          ) : (
            getCashPaymentMethods().map((method) => {
              const IconComponent = getIcon(method.icon)
              
              return (
                <Card key={method.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          method.isActive 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {method.name}
                            <Badge variant={method.isActive ? "default" : "secondary"}>
                              {method.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                            {method._count?.payments && method._count.payments > 0 && (
                              <Badge variant="outline">
                                {method._count.payments} paiement(s)
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-gray-100 px-1 rounded text-xs">{method.code}</code>
                            <Badge variant="outline" className="text-xs">
                              💵 Paiement espèce
                            </Badge>
                          </div>
                          {method.description && (
                            <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                          )}
                          
                          {/* Informations du point de paiement */}
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Point de paiement
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Nom du point:</span>
                                <p className="text-gray-900">{method.name}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Code point:</span>
                                <p className="text-gray-900 font-mono">{method.code}</p>
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Adresse exacte:</span>
                                <p className="text-gray-900">
                                  {method.apiEndpoint || 'Adresse à configurer'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Responsable:</span>
                                <p className="text-gray-900">
                                  À configurer
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Téléphone:</span>
                                <p className="text-gray-900 font-mono">
                                  {method.publicKey || 'À configurer'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Horaires d'ouverture:</span>
                                <p className="text-gray-900">
                                  Lun-Ven: 8h-17h, Sam: 8h-12h
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Frais de service:</span>
                                <p className="text-gray-900">
                                  {formatFee(method.feeType, method.feeValue)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Instructions pour le client */}
                            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                              <h5 className="font-medium text-blue-800 text-xs mb-1">Instructions pour le client:</h5>
                              <p className="text-blue-700 text-xs">
                                Présentez-vous à cette adresse avec votre numéro de commande et le montant exact en espèces.
                                Une pièce d'identité peut être demandée.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMethodStatus(method.id, method.isActive)}
                        >
                          {method.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMethod(method)
                            setShowMethodForm(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'method', id: method.id })}
                          disabled={method._count?.payments && method._count.payments > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

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
