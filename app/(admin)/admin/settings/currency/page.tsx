'use client'

import { useState, useEffect, useCallback } from 'react'
import { convertCurrency, defaultExchangeRates } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ArrowRight, RefreshCw, ChevronsUpDown, AlertCircle } from 'lucide-react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CurrencySelector, PriceWithConversion } from '@/components/ui/currency-selector'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Liste des devises populaires (incluant MGA)
const popularCurrencies = ['MGA', 'EUR', 'USD', 'GBP', 'CAD', 'CHF'];

// Noms des devises pour l'affichage
const currencyNames: Record<string, string> = {
  'MGA': 'Ariary Malgache',
  'EUR': 'Euro',
  'USD': 'Dollar US',
  'GBP': 'Livre Sterling',
  'CAD': 'Dollar Canadien',
  'CHF': 'Franc Suisse'
}

// Liste des symboles de devise
const currencySymbols: Record<string, string> = {
  'MGA': 'Ar',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'CAD': 'CA$',
  'CHF': 'CHF'
}

// Hook personnalisé pour gérer les taux de change
function useExchangeRates() {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(defaultExchangeRates)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(() => {
    setIsLoading(true)
    setError(null)
    
    fetch('/api/admin/settings/currency', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        let finalRates = {...defaultExchangeRates};
        if (data.exchangeRates && Object.keys(data.exchangeRates).length > 0) {
          finalRates = {...data.exchangeRates};
        }
        setExchangeRates(finalRates)
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des taux de change:', err)
        setError('Erreur lors de la récupération des taux de change')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const updateRates = (newRates: Record<string, number>) => {
    setExchangeRates(newRates)
    return fetch('/api/admin/settings/currency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newRates)
    })
  }

  const syncRates = (force: boolean = false) => {
    return fetch(`/api/admin/settings/currency/sync?force=${force}`, {
      credentials: 'include'
    })
  }

  return {
    exchangeRates,
    setExchangeRates,
    isLoading,
    error,
    fetchRates,
    updateRates,
    syncRates
  }
}

export default function CurrencyConverterAdminPage() {
  const { settings } = useSiteSettings()
  const { 
    exchangeRates, 
    setExchangeRates,
    isLoading: isLoadingRates,
    error: ratesError,
    fetchRates,
    updateRates,
    syncRates
  } = useExchangeRates()
  
  const [amount, setAmount] = useState<string>('100')
  const [fromCurrency, setFromCurrency] = useState<string>('')
  const [toCurrency, setToCurrency] = useState<string>('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [testPrice, setTestPrice] = useState<string>('49.99')
  const [isUpdatingRates, setIsUpdatingRates] = useState(false)
  const [editableRates, setEditableRates] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Initialiser les taux éditables quand les taux de change changent
  useEffect(() => {
    const initialEditableRates: Record<string, string> = {};
    Object.entries(exchangeRates).forEach(([currency, rate]) => {
      initialEditableRates[currency] = String(rate);
    });
    setEditableRates(initialEditableRates);
  }, [exchangeRates])

  // Initialiser les devises par défaut
  useEffect(() => {
    const currencies = Object.keys(exchangeRates);
    
    if (!fromCurrency || !currencies.includes(fromCurrency)) {
      setFromCurrency('MGA');
    }
    
    if (!toCurrency || !currencies.includes(toCurrency)) {
      const savedTargetCurrency = localStorage.getItem('selectedCurrency');
      if (savedTargetCurrency && currencies.includes(savedTargetCurrency) && savedTargetCurrency !== 'MGA') {
        setToCurrency(savedTargetCurrency);
      } else {
        const otherCurrency = currencies.find(c => c !== 'MGA') || 
                            (currencies.length > 0 ? currencies[0] : 'EUR');
        setToCurrency(otherCurrency);
      }
    }
  }, [exchangeRates, fromCurrency, toCurrency])

  const handleUpdateRates = () => {
    setIsUpdatingRates(true)
    const ratesToUpdate: Record<string, number> = {}
    Object.entries(editableRates).forEach(([currency, rateStr]) => {
      ratesToUpdate[currency] = parseFloat(rateStr)
    })
    
    updateRates(ratesToUpdate)
      .then(response => {
        if (response.ok) {
          setExchangeRates(ratesToUpdate)
          setIsEditing(false)
          alert('Les taux de change ont été mis à jour avec succès!')
        } else {
          alert('Erreur lors de la mise à jour des taux de change')
        }
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour des taux de change:', error)
        alert('Erreur lors de la mise à jour des taux de change')
      })
      .finally(() => {
        setIsUpdatingRates(false)
      })
  }

  const handleSyncRates = (force: boolean = false) => {
    setIsSyncing(true)
    setSyncMessage(null)
    
    syncRates(force)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setSyncMessage({
            type: 'success',
            text: 'Les taux de change ont été synchronisés avec succès.'
          })
          fetchRates() // Recharger les taux
        } else {
          setSyncMessage({
            type: 'error',
            text: data.error || 'Erreur lors de la synchronisation.'
          })
        }
      })
      .catch(error => {
        console.error('Erreur lors de la synchronisation:', error)
        setSyncMessage({
          type: 'error',
          text: 'Erreur lors de la synchronisation des taux de change.'
        })
      })
      .finally(() => {
        setIsSyncing(false)
      })
  }

  const handleConvert = () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || !fromCurrency || !toCurrency) {
      return
    }
    
    const result = convertCurrency(amountNum, fromCurrency, toCurrency, exchangeRates)
    setConvertedAmount(result)
  }
  
  const handleSwapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
  }
  
  const formatAmountWithSymbol = (amount: number, currencyCode: string) => {
    return `${amount.toFixed(2)} ${currencySymbols[currencyCode] || currencyCode}`
  }
  
  // Tester l'API et afficher les résultats
  const testApi = async () => {
    try {
      setDebugInfo('Chargement...')
      
      const response = await fetch('/api/admin/settings/currency', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const info = `
          Réponse API: 
          Type: ${typeof data}
          Clés: ${Object.keys(data).join(', ')}
          Valeurs: ${JSON.stringify(data, null, 2)}
          Sélecteurs:
          - FromCurrency: "${fromCurrency}"
          - ToCurrency: "${toCurrency}"
        `
        setDebugInfo(info)
      } else {
        setDebugInfo(`Erreur API: ${response.status}`)
      }
    } catch (error) {
      setDebugInfo(`Erreur: ${error}`)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des devises</h1>
        <p className="text-muted-foreground">
          Configurez les paramètres de devise et effectuez des conversions.
        </p>
      </div>
      
      <Tabs defaultValue="converter" className="space-y-4">
        <TabsList>
          <TabsTrigger value="converter">Convertisseur</TabsTrigger>
          <TabsTrigger value="test">Test d'affichage</TabsTrigger>
          <TabsTrigger value="rates">Taux de change</TabsTrigger>
        </TabsList>
        
        <TabsContent value="converter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convertisseur de devises</CardTitle>
              <CardDescription>
                Convertissez des montants entre différentes devises en utilisant les taux de change configurés.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                <div>
                  <Label htmlFor="fromCurrency">De</Label>
                  <Select
                    value={fromCurrency}
                    onValueChange={setFromCurrency}
                  >
                    <SelectTrigger id="fromCurrency" className="mt-1">
                      <SelectValue placeholder="Choisir une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Devises</SelectLabel>
                        {popularCurrencies
                          .filter(currency => exchangeRates[currency] !== undefined)
                          .map((currency) => (
                            <SelectItem key={`from-${currency}`} value={currency}>
                              {currencyNames[currency] || currency} ({currencySymbols[currency] || currency})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSwapCurrencies}
                  className="mt-6"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <div>
                  <Label htmlFor="toCurrency">Vers</Label>
                  <Select
                    value={toCurrency}
                    onValueChange={setToCurrency}
                  >
                    <SelectTrigger id="toCurrency" className="mt-1">
                      <SelectValue placeholder="Choisir une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Devises</SelectLabel>
                        {popularCurrencies
                          .filter(currency => exchangeRates[currency] !== undefined)
                          .map((currency) => (
                            <SelectItem key={`to-${currency}`} value={currency}>
                              {currencyNames[currency] || currency} ({currencySymbols[currency] || currency})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={handleConvert}
                className="w-full"
                disabled={!amount || !fromCurrency || !toCurrency}
              >
                Convertir
              </Button>
              
              {convertedAmount !== null && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Résultat</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-lg font-medium">
                      {formatAmountWithSymbol(parseFloat(amount), fromCurrency)}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 mx-2" />
                    <div className="text-lg font-medium">
                      {formatAmountWithSymbol(convertedAmount, toCurrency)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Taux: 1 {fromCurrency} = {exchangeRates[toCurrency] / exchangeRates[fromCurrency]} {toCurrency}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test d'affichage des prix</CardTitle>
              <CardDescription>
                Testez comment vos prix s'afficheront avec différentes devises.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="testPrice">Prix test</Label>
                <Input
                  id="testPrice"
                  type="number"
                  value={testPrice}
                  onChange={(e) => setTestPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="mt-4">
                <Label>Sélectionnez une devise d'affichage</Label>
                <div className="mt-2">
                  <CurrencySelector className="w-full" />
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Affichage normal</p>
                  <div className="text-xl font-medium">
                    <PriceWithConversion price={parseFloat(testPrice)} />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Exemple dans un produit</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                    <div>
                      <p className="font-medium">Produit exemple</p>
                      <p className="text-blue-600">
                        <PriceWithConversion price={parseFloat(testPrice)} />
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Exemple avec réduction</p>
                  <div>
                    <Badge className="mb-1 bg-red-500">-20%</Badge>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600 font-medium">
                        <PriceWithConversion price={parseFloat(testPrice) * 0.8} />
                      </span>
                      <span className="text-gray-500 text-sm line-through">
                        <PriceWithConversion price={parseFloat(testPrice)} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taux de change</CardTitle>
              <CardDescription>
                Consultez et modifiez les taux de change utilisés pour les conversions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncMessage && (
                  <Alert variant={syncMessage.type === 'error' ? 'destructive' : syncMessage.type === 'success' ? 'default' : 'secondary'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {syncMessage.type === 'success' ? 'Synchronisation réussie' : 
                       syncMessage.type === 'error' ? 'Erreur' : 'Information'}
                    </AlertTitle>
                    <AlertDescription>
                      {syncMessage.text}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between mb-2">
                  <Button
                    variant="outline"
                    onClick={testApi}
                  >
                    Tester API
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleSyncRates(true)}
                    disabled={isSyncing}
                    className="ml-auto"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Synchroniser avec fxratesapi.com
                      </>
                    )}
                  </Button>
                </div>
                
                {debugInfo && (
                  <div className="mb-4 p-4 border rounded bg-slate-50 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-60">
                    {debugInfo}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mb-4">
                  Voici les taux de change utilisés par l'application pour convertir les prix entre les différentes devises.
                  Ces taux sont basés sur la devise principale configurée dans les paramètres généraux ({getSetting(settings, 'currency', 'EUR')}).
                </p>
                
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Devise</th>
                        <th className="px-4 py-2 text-left">Code</th>
                        <th className="px-4 py-2 text-left">Symbole</th>
                        <th className="px-4 py-2 text-right">Taux de change</th>
                        {isEditing && (
                          <th className="px-4 py-2 text-right">Nouveau taux</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {/* Filtre pour n'afficher que les devises populaires */}
                      {Object.entries(exchangeRates)
                        .filter(([currency]) => popularCurrencies.includes(currency))
                        .map(([currency, rate]) => (
                        <tr key={currency} className={currency === 'MGA' ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-2">
                            {currency === 'MGA' ? (
                              <Badge variant="outline" className="font-normal">
                                {currencyNames[currency] || currency}
                              </Badge>
                            ) : (
                              <span>
                                {currencyNames[currency] || currency}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">{currency}</td>
                          <td className="px-4 py-2">{currencySymbols[currency]}</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {currency === 'MGA' ? (
                              <span className="font-medium">1.0000 (Base)</span>
                            ) : (
                              <span>{rate !== null && rate !== undefined ? rate.toFixed(4) : '0.0000'}</span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="px-4 py-2 text-right">
                              {currency === 'MGA' ? (
                                <span className="text-sm text-gray-500">Devise de base</span>
                              ) : (
                                <Input
                                  type="number"
                                  step="0.0001"
                                  min="0.0001"
                                  value={editableRates[currency] || String(rate)}
                                  onChange={(e) => {
                                    setEditableRates(prev => ({
                                      ...prev,
                                      [currency]: e.target.value
                                    }))
                                  }}
                                  className="w-32 ml-auto text-right"
                                />
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Note: Ces taux sont approximatifs et peuvent ne pas refléter les taux actuels du marché.
                  Pour des applications commerciales sensibles, envisagez d'utiliser une API de taux de change en temps réel.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleUpdateRates} 
                    disabled={isUpdatingRates}
                  >
                    {isUpdatingRates ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      'Enregistrer les taux'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={fetchRates}
                  >
                    Actualiser
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier les taux
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
 
 
 