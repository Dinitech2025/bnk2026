'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Truck, 
  MapPin, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Package,
  Calculator,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { DeliveryMethodForm } from '@/components/admin/delivery/delivery-method-form'
import { DeliveryZoneForm } from '@/components/admin/delivery/delivery-zone-form'
import { PricingRuleForm } from '@/components/admin/delivery/pricing-rule-form'
import { DeliveryTracking } from '@/components/admin/delivery/delivery-tracking'

interface DeliveryMethod {
  id: string
  name: string
  description: string
  type: 'api' | 'manual'
  isActive: boolean
  apiConfig?: {
    provider: string
    apiKey: string
    endpoint: string
  }
  estimatedDays: {
    min: number
    max: number
  }
  icon: string
  createdAt: string
}

interface DeliveryZone {
  id: string
  name: string
  description: string
  type: 'country' | 'region' | 'city' | 'postal'
  areas: string[]
  isActive: boolean
  createdAt: string
}

interface PricingRule {
  id: string
  deliveryMethodId: string
  deliveryZoneId: string
  deliveryMethod?: DeliveryMethod
  deliveryZone?: DeliveryZone
  weightRanges: {
    min: number
    max: number
    basePrice: number
    additionalPerKg: number
  }[]
  volumeRanges: {
    min: number
    max: number
    basePrice: number
    additionalPerM3: number
  }[]
  fixedPrice?: number
  freeShippingThreshold?: number
  isActive: boolean
  createdAt: string
}

export default function DeliverySettingsPage() {
  const [activeTab, setActiveTab] = useState('methods')
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([])
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)

  // Forms state
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [showPricingForm, setShowPricingForm] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod | null>(null)
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [selectedPricingRule, setSelectedPricingRule] = useState<PricingRule | null>(null)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'method' | 'zone' | 'pricing'
    id: string
    name: string
  } | null>(null)

  // Delivery tracking
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les données depuis les APIs
      const [methodsRes, zonesRes, rulesRes] = await Promise.all([
        fetch('/api/admin/delivery-methods'),
        fetch('/api/admin/delivery-zones'),
        fetch('/api/admin/pricing-rules')
      ])

      if (methodsRes.ok) {
        const methods = await methodsRes.json()
        setDeliveryMethods(methods)
      }

      if (zonesRes.ok) {
        const zones = await zonesRes.json()
        setDeliveryZones(zones)
      }

      if (rulesRes.ok) {
        const rules = await rulesRes.json()
        setPricingRules(rules)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/delivery-methods/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setDeliveryMethods(prev => prev.filter(m => m.id !== id))
        setDeleteConfirm(null)
      } else {
        console.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleDeleteZone = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setDeliveryZones(prev => prev.filter(z => z.id !== id))
        setDeleteConfirm(null)
      } else {
        console.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleDeletePricingRule = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/pricing-rules/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setPricingRules(prev => prev.filter(r => r.id !== id))
        setDeleteConfirm(null)
      } else {
        console.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const getMethodName = (methodId: string) => {
    return deliveryMethods.find(m => m.id === methodId)?.name || 'Méthode inconnue'
  }

  const getZoneName = (zoneId: string) => {
    return deliveryZones.find(z => z.id === zoneId)?.name || 'Zone inconnue'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
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
            Paramètres de Livraison
          </h1>
          <p className="text-slate-600 mt-1">
            Gérez vos modes de livraison, zones et tarification
          </p>
        </div>
        <Button 
          onClick={() => setShowDeliveryTracking(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Truck className="h-4 w-4 mr-2" />
          Suivi des Livraisons
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="methods" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Truck className="h-4 w-4 mr-2" />
              Modes de Livraison
            </TabsTrigger>
            <TabsTrigger value="zones" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MapPin className="h-4 w-4 mr-2" />
              Zones de Livraison
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Calculator className="h-4 w-4 mr-2" />
              Tarification
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Delivery Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-500" />
                    Modes de Livraison
                  </CardTitle>
                  <p className="text-slate-600 mt-1">API et modes manuels</p>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedMethod(null)
                    setShowMethodForm(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deliveryMethods.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun mode de livraison</h3>
                  <p className="text-slate-600 mb-6">Ajoutez des modes de livraison API ou manuels</p>
                  <Button 
                    onClick={() => {
                      setSelectedMethod(null)
                      setShowMethodForm(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier mode
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveryMethods.map((method) => (
                    <div key={method.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${method.type === 'api' ? 'bg-blue-50' : 'bg-green-50'}`}>
                            {method.type === 'api' ? (
                              <Globe className={`h-6 w-6 ${method.type === 'api' ? 'text-blue-500' : 'text-green-500'}`} />
                            ) : (
                              <Package className="h-6 w-6 text-green-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{method.name}</h3>
                              <Badge variant={method.type === 'api' ? 'default' : 'secondary'}>
                                {method.type === 'api' ? 'API' : 'Manuel'}
                              </Badge>
                              <Badge variant={method.isActive ? 'default' : 'secondary'}>
                                {method.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <p className="text-slate-600 text-sm">{method.description}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {method.estimatedDays.min}-{method.estimatedDays.max} jours
                              </div>
                              {method.type === 'api' && method.apiConfig && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Globe className="h-3 w-3" />
                                  {method.apiConfig.provider}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMethod(method)
                              setShowMethodForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm({
                              type: 'method',
                              id: method.id,
                              name: method.name
                            })}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Zones de Livraison
                  </CardTitle>
                  <p className="text-slate-600 mt-1">Pays, régions, villes et codes postaux</p>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedZone(null)
                    setShowZoneForm(true)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deliveryZones.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune zone définie</h3>
                  <p className="text-slate-600 mb-6">Définissez des zones géographiques pour la livraison</p>
                  <Button 
                    onClick={() => {
                      setSelectedZone(null)
                      setShowZoneForm(true)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter la première zone
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveryZones.map((zone) => (
                    <div key={zone.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <MapPin className="h-6 w-6 text-green-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{zone.name}</h3>
                              <Badge variant="outline">
                                {zone.type}
                              </Badge>
                              <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                                {zone.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <p className="text-slate-600 text-sm">{zone.description}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                              <span>{zone.areas.length} zone(s):</span>
                              <span>{zone.areas.slice(0, 3).join(', ')}</span>
                              {zone.areas.length > 3 && <span>...</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedZone(zone)
                              setShowZoneForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm({
                              type: 'zone',
                              id: zone.id,
                              name: zone.name
                            })}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Rules Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-500" />
                    Règles de Tarification
                  </CardTitle>
                  <p className="text-slate-600 mt-1">Prix selon zone, poids et volume</p>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedPricingRule(null)
                    setShowPricingForm(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={deliveryMethods.length === 0 || deliveryZones.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deliveryMethods.length === 0 || deliveryZones.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Prérequis manquants</h3>
                  <p className="text-slate-600 mb-6">
                    Vous devez d'abord créer des modes de livraison et des zones
                  </p>
                  <div className="flex gap-3 justify-center">
                    {deliveryMethods.length === 0 && (
                      <Button 
                        onClick={() => setActiveTab('methods')}
                        variant="outline"
                      >
                        Créer un mode de livraison
                      </Button>
                    )}
                    {deliveryZones.length === 0 && (
                      <Button 
                        onClick={() => setActiveTab('zones')}
                        variant="outline"
                      >
                        Créer une zone
                      </Button>
                    )}
                  </div>
                </div>
              ) : pricingRules.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune règle définie</h3>
                  <p className="text-slate-600 mb-6">Créez des règles de tarification pour vos livraisons</p>
                  <Button 
                    onClick={() => {
                      setSelectedPricingRule(null)
                      setShowPricingForm(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter la première règle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pricingRules.map((rule) => (
                    <div key={rule.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <Calculator className="h-6 w-6 text-purple-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">
                                {getMethodName(rule.deliveryMethodId)} → {getZoneName(rule.deliveryZoneId)}
                              </h3>
                              <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                                {rule.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              {rule.fixedPrice && (
                                <p>Prix fixe: {rule.fixedPrice.toLocaleString()} Ar</p>
                              )}
                              {rule.weightRanges.length > 0 && (
                                <p>Tranches de poids: {rule.weightRanges.length} règle(s)</p>
                              )}
                              {rule.volumeRanges.length > 0 && (
                                <p>Tranches de volume: {rule.volumeRanges.length} règle(s)</p>
                              )}
                              {rule.freeShippingThreshold && (
                                <p>Livraison gratuite à partir de: {rule.freeShippingThreshold.toLocaleString()} Ar</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPricingRule(rule)
                              setShowPricingForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm({
                              type: 'pricing',
                              id: rule.id,
                              name: `${getMethodName(rule.deliveryMethodId)} → ${getZoneName(rule.deliveryZoneId)}`
                            })}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showMethodForm && (
        <DeliveryMethodForm
          method={selectedMethod}
          onSave={(method) => {
            if (selectedMethod) {
              setDeliveryMethods(prev => prev.map(m => m.id === method.id ? method as DeliveryMethod : m))
            } else {
              setDeliveryMethods(prev => [...prev, { ...method, id: Date.now().toString() } as DeliveryMethod])
            }
            setShowMethodForm(false)
            setSelectedMethod(null)
          }}
          onCancel={() => {
            setShowMethodForm(false)
            setSelectedMethod(null)
          }}
        />
      )}

      {showZoneForm && (
        <DeliveryZoneForm
          zone={selectedZone}
          onSave={(zone) => {
            if (selectedZone) {
              setDeliveryZones(prev => prev.map(z => z.id === zone.id ? zone as DeliveryZone : z))
            } else {
              setDeliveryZones(prev => [...prev, { ...zone, id: Date.now().toString() } as DeliveryZone])
            }
            setShowZoneForm(false)
            setSelectedZone(null)
          }}
          onCancel={() => {
            setShowZoneForm(false)
            setSelectedZone(null)
          }}
        />
      )}

      {showPricingForm && (
        <PricingRuleForm
          rule={selectedPricingRule}
          deliveryMethods={deliveryMethods}
          deliveryZones={deliveryZones}
          onSave={(rule) => {
            if (selectedPricingRule) {
              setPricingRules(prev => prev.map(r => r.id === rule.id ? rule as PricingRule : r))
            } else {
              setPricingRules(prev => [...prev, { ...rule, id: Date.now().toString() } as PricingRule])
            }
            setShowPricingForm(false)
            setSelectedPricingRule(null)
          }}
          onCancel={() => {
            setShowPricingForm(false)
            setSelectedPricingRule(null)
          }}
        />
      )}

      {/* Delivery Tracking */}
      <DeliveryTracking
        isOpen={showDeliveryTracking}
        onClose={() => setShowDeliveryTracking(false)}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer "{deleteConfirm.name}" ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirm.type === 'method') {
                    handleDeleteMethod(deleteConfirm.id)
                  } else if (deleteConfirm.type === 'zone') {
                    handleDeleteZone(deleteConfirm.id)
                  } else if (deleteConfirm.type === 'pricing') {
                    handleDeletePricingRule(deleteConfirm.id)
                  }
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}