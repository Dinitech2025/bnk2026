'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Truck, Store, Clock, MapPin, Home, Building2 } from 'lucide-react'

interface DeliveryOption {
  id: string
  code: string
  name: string
  description: string
  price: number
  estimatedTime: string
  isAvailable: boolean
  icon: React.ReactNode
}

interface DeliveryOptionsProps {
  selectedDeliveryId: string | null
  onDeliveryChange: (delivery: DeliveryOption | null) => void
  shippingAddress?: {
    city: string
    country: string
  }
}

// Options de livraison par défaut
const defaultDeliveryOptions: DeliveryOption[] = [
  {
    id: 'home_delivery',
    code: 'home_delivery',
    name: 'Livraison à domicile',
    description: 'Livraison directe à votre adresse',
    price: 5000, // 5000 Ar
    estimatedTime: '2-3 jours ouvrés',
    isAvailable: true,
    icon: <Home className="h-5 w-5" />
  },
  {
    id: 'express_delivery',
    code: 'express_delivery',
    name: 'Livraison express',
    description: 'Livraison rapide dans la journée',
    price: 10000, // 10000 Ar
    estimatedTime: '24h',
    isAvailable: true,
    icon: <Truck className="h-5 w-5 text-orange-500" />
  },
  {
    id: 'pickup_store',
    code: 'pickup_store',
    name: 'Retrait en magasin',
    description: 'Récupérez votre commande dans notre magasin',
    price: 0, // Gratuit
    estimatedTime: '1-2 jours ouvrés',
    isAvailable: true,
    icon: <Store className="h-5 w-5 text-green-600" />
  },
  {
    id: 'pickup_point',
    code: 'pickup_point',
    name: 'Point de retrait',
    description: 'Retrait dans un point partenaire proche',
    price: 2000, // 2000 Ar
    estimatedTime: '2-3 jours ouvrés',
    isAvailable: true,
    icon: <MapPin className="h-5 w-5 text-blue-600" />
  }
]

export function DeliveryOptions({
  selectedDeliveryId,
  onDeliveryChange,
  shippingAddress
}: DeliveryOptionsProps) {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadDeliveryOptions()
  }, [shippingAddress])

  const loadDeliveryOptions = async () => {
    try {
      setIsLoading(true)
      
      // Pour l'instant, utiliser les options par défaut
      // TODO: Récupérer depuis l'API selon la localisation
      let availableOptions = [...defaultDeliveryOptions]
      
      // Adapter selon la localisation
      if (shippingAddress) {
        // Exemple : limiter express delivery à certaines villes
        if (shippingAddress.city.toLowerCase() !== 'antananarivo') {
          availableOptions = availableOptions.map(option => 
            option.code === 'express_delivery' 
              ? { ...option, isAvailable: false, description: 'Non disponible dans votre région' }
              : option
          )
        }
        
        // Limiter retrait magasin aux principales villes
        const majorCities = ['antananarivo', 'toamasina', 'antsirabe', 'mahajanga']
        if (!majorCities.includes(shippingAddress.city.toLowerCase())) {
          availableOptions = availableOptions.map(option => 
            option.code === 'pickup_store'
              ? { ...option, isAvailable: false, description: 'Pas de magasin dans votre région' }
              : option
          )
        }
      }
      
      setDeliveryOptions(availableOptions)
      
    } catch (error) {
      console.error('Erreur chargement options livraison:', error)
      // En cas d'erreur, utiliser les options par défaut
      setDeliveryOptions(defaultDeliveryOptions)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeliveryChange = (deliveryId: string) => {
    const delivery = deliveryOptions.find(d => d.id === deliveryId)
    onDeliveryChange(delivery || null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Mode de livraison</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedDeliveryId || ''}
          onValueChange={handleDeliveryChange}
        >
          <div className="space-y-3">
            {deliveryOptions.map((option) => (
              <div
                key={option.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDeliveryId === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!option.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Label
                  htmlFor={option.id}
                  className={`flex items-center space-x-3 cursor-pointer ${
                    !option.isAvailable ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    disabled={!option.isAvailable}
                  />
                  
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {option.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{option.name}</span>
                            {!option.isAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                Indisponible
                              </Badge>
                            )}
                            {option.price === 0 && option.isAvailable && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                Gratuit
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {option.description}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {option.price === 0 ? 'Gratuit' : `${option.price.toLocaleString()} Ar`}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {option.estimatedTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        
        {selectedDeliveryId && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Truck className="h-4 w-4" />
              <span className="font-medium">Mode de livraison sélectionné</span>
            </div>
            {(() => {
              const selected = deliveryOptions.find(d => d.id === selectedDeliveryId)
              return selected ? (
                <div className="mt-1 text-sm text-blue-700">
                  <div className="flex justify-between items-center">
                    <span>{selected.name}</span>
                    <span className="font-medium">
                      {selected.price === 0 ? 'Gratuit' : `+${selected.price.toLocaleString()} Ar`}
                    </span>
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    Délai : {selected.estimatedTime}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        )}
        
        {shippingAddress && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Livraison à : {shippingAddress.city}, {shippingAddress.country}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}








