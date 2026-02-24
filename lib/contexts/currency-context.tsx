'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSiteSettings } from '@/lib/hooks/use-site-settings'
import { formatPrice, convertCurrency, defaultExchangeRates } from '@/lib/utils'
import { ClientOnly } from '@/components/ui/client-only'

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  targetCurrency: string | null;
  setTargetCurrency: (currency: string | null) => void;
  formatCurrency: (price: number) => string;
  formatWithTargetCurrency: (price: number, targetCurrency: string) => string;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSiteSettings()
  const [currency, setCurrency] = useState('MGA')
  const [currencySymbol, setCurrencySymbol] = useState('Ar')
  const [targetCurrency, setTargetCurrency] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(defaultExchangeRates)
  const [isMounted, setIsMounted] = useState(false)
  
  
  // Marquer le composant comme monté
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Récupérer les taux de change depuis l'API et la devise sélectionnée depuis localStorage
  useEffect(() => {
    if (!isMounted) return
    
    // Charger la devise sélectionnée depuis localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedCurrency = localStorage.getItem('selectedCurrency')
        if (savedCurrency) {
          setTargetCurrency(savedCurrency)
        }
      }
    } catch (error) {
      console.warn('Impossible d\'accéder au localStorage pour selectedCurrency:', error)
    }
    
    // Vérifier le cache des taux de change
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cachedRates = localStorage.getItem('exchangeRates')
        const cachedTimestamp = localStorage.getItem('exchangeRatesTimestamp')
        const ONE_SECOND = 1000 // Force rechargement pour test
      
        if (cachedRates && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp)
          if (Date.now() - timestamp < ONE_SECOND) {
            setExchangeRates(JSON.parse(cachedRates))
            return
          }
        }
      }
    } catch (error) {
      console.warn('Impossible d\'accéder au localStorage pour le cache:', error)
    }
    
    // Charger les taux de change depuis l'API si pas de cache valide
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('/api/public/exchange-rates')
        if (response.ok) {
          const data = await response.json()

          // S'assurer que MGA reste la devise de base
          setCurrency('MGA')
          setCurrencySymbol('Ar')
          
          if (data.exchangeRates && Object.keys(data.exchangeRates).length > 0) {
            setExchangeRates(data.exchangeRates)
            // Mettre à jour le cache
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('exchangeRates', JSON.stringify(data.exchangeRates))
                localStorage.setItem('exchangeRatesTimestamp', Date.now().toString())
              }
            } catch (error) {
              console.warn('Impossible de sauvegarder le cache:', error)
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des taux de change:', error)
      }
    }
    
    fetchExchangeRates()
  }, [isMounted])
  
  // Fonction pour formater un prix avec les paramètres de devise principale
  const formatCurrency = useCallback((price: number) => {
    return formatPrice(price, currency, currencySymbol)
  }, [currency, currencySymbol])
  
  // Obtenir le symbole pour une devise spécifique
  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    const symbols: Record<string, string> = {
      'MGA': 'Ar',
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CAD': 'CA$',
      'CHF': 'CHF'
    }
    return symbols[currencyCode] || currencyCode
  }, [])
  
  // Fonction pour convertir un prix vers une autre devise
  const convertToTargetCurrency = useCallback((price: number, targetCurrency: string) => {
    // Si les devises sont identiques, retourner le montant tel quel
    if (currency === targetCurrency) return price;
    
    // Utiliser les taux par défaut si les taux de l'API ne sont pas disponibles
    const finalRates = Object.keys(exchangeRates).length > 3 ? exchangeRates : defaultExchangeRates;
    
    // Debug temporaire
    console.log('🔄 Conversion DEBUG:', {
      price,
      fromCurrency: currency,
      targetCurrency,
      targetRate: finalRates[targetCurrency],
      mgaRate: finalRates['MGA'],
      hasEUR: 'EUR' in finalRates,
      hasGBP: 'GBP' in finalRates,
      ratesLength: Object.keys(finalRates).length,
      usingDefault: Object.keys(exchangeRates).length <= 3
    })
    
    // Utiliser la fonction convertCurrency des utils qui fonctionne correctement
    try {
      return convertCurrency(price, currency, targetCurrency, finalRates)
    } catch (error) {
      console.error('❌ Erreur de conversion:', error)
      return price // Retourner le prix original en cas d'erreur
    }
  }, [currency, exchangeRates])
  
  // Fonction pour formater un prix dans une devise cible spécifique
  const formatWithTargetCurrency = useCallback((price: number, targetCurrency: string) => {
    const convertedPrice = convertToTargetCurrency(price, targetCurrency)
    const targetSymbol = getCurrencySymbol(targetCurrency)
    return `${convertedPrice.toLocaleString('fr-FR')} ${targetSymbol}`
  }, [convertToTargetCurrency, getCurrencySymbol])
  
  const value = {
    currency,
    currencySymbol,
    targetCurrency,
    setTargetCurrency,
    formatCurrency,
    formatWithTargetCurrency,
    exchangeRates,
    isLoading
  }
  
  return (
    <ClientOnly fallback={
      <CurrencyContext.Provider value={value}>
        {children}
      </CurrencyContext.Provider>
    }>
      <CurrencyContext.Provider value={value}>
        {children}
      </CurrencyContext.Provider>
    </ClientOnly>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
} 
 
 
 
 
 
 