'use client'

import { useCallback, useState, useEffect } from 'react'
import { useCurrency } from '@/lib/hooks/use-currency'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { defaultExchangeRates } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Liste des devises populaires (incluant MGA)
const popularCurrencies = ['MGA', 'EUR', 'USD', 'GBP'];

// Noms des devises pour l'affichage
const currencyNames: Record<string, string> = {
  'MGA': 'Ariary Malgache',
  'EUR': 'Euro',
  'USD': 'Dollar US',
  'GBP': 'Livre Sterling'
};

// Liste des symboles de devise
const currencySymbols: Record<string, string> = {
  'MGA': 'Ar',
  'EUR': '€',
  'USD': '$',
  'GBP': '£'
};

interface CurrencySelectorProps {
  className?: string;
}

export function CurrencySelector({ className }: CurrencySelectorProps) {
  const { 
    currency,
    targetCurrency, 
    setTargetCurrency
  } = useCurrency()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  
  // Marquer le composant comme monté
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Liste des devises disponibles (uniquement les populaires)
  const currencies = popularCurrencies.filter(code => defaultExchangeRates[code] !== undefined)
  
  // Filtrer les devises selon le terme de recherche
  const filteredCurrencies = currencies.filter(code => 
    code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currencyNames[code]?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Sauvegarder la devise sélectionnée dans le localStorage
  const handleValueChange = useCallback((value: string) => {
    setTargetCurrency(value)
    if (isMounted) {
      try {
        localStorage.setItem('selectedCurrency', value)
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la devise:', error)
      }
    }
  }, [setTargetCurrency, isMounted])
  
  return (
    <div className={className}>
      <Select
        value={targetCurrency || currency}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className="font-medium">{currencySymbols[targetCurrency || currency]}</span>
              <span className="text-sm text-muted-foreground">
                {targetCurrency || currency}
              </span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <div className="px-3 py-2">
              <Input
                placeholder="Rechercher une devise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            {filteredCurrencies.map((currencyCode) => (
              <SelectItem
                key={currencyCode}
                value={currencyCode}
                className="cursor-pointer py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currencySymbols[currencyCode]}</span>
                  <span className="text-sm text-muted-foreground">
                    {currencyCode}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({currencyNames[currencyCode]})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

// Composant pour afficher un prix avec conversion
export function PriceWithConversion({ 
  price,
  defaultCurrency = 'MGA'
}: { 
  price: number | undefined | null;
  defaultCurrency?: string;
}) {
  const { 
    formatCurrency, 
    targetCurrency,
    formatWithTargetCurrency,
    isLoading
  } = useCurrency()
  
  const [isMounted, setIsMounted] = useState(false)
  
  // Marquer le composant comme monté pour éviter les erreurs d'hydratation
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Vérifier si le prix est défini
  if (price === undefined || price === null) {
    return <span>Prix non disponible</span>
  }
  
  // Pendant le chargement côté serveur et avant le montage côté client, 
  // afficher toujours en Ariary pour éviter les différences d'hydratation
  if (!isMounted || isLoading) {
    return <span>{price.toLocaleString('fr-FR')} Ar</span>
  }
  
  // Une fois monté côté client, utiliser la devise sélectionnée
  if (targetCurrency && targetCurrency !== 'MGA') {
    return <span>{formatWithTargetCurrency(price, targetCurrency)}</span>
  }
  
  return <span>{formatCurrency(price)}</span>
} 
 
 
 
 
 
 