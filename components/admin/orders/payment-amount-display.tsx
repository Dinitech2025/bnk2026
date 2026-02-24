'use client'

import { useCurrency } from '@/components/providers/currency-provider'
import { convertCurrency, defaultExchangeRates } from '@/lib/utils'

interface PaymentAmountDisplayProps {
  amount: number
  currency: string
  originalAmount?: number
  paymentExchangeRate?: number
  paymentDisplayCurrency?: string
}

export function PaymentAmountDisplay({ 
  amount, 
  currency, 
  originalAmount, 
  paymentExchangeRate,
  paymentDisplayCurrency
}: PaymentAmountDisplayProps) {
  const { targetCurrency } = useCurrency()

  // Taux de change actuels pour la conversion
  const currentRates = {
    'MGA': 1.0,
    'Ar': 1.0,
    'EUR': 0.000196,  // 1 MGA = 0.000196 EUR
    'USD': 0.000214,  // 1 MGA = 0.000214 USD
    'GBP': 0.000168   // 1 MGA = 0.000168 GBP
  }

  // Fonction pour convertir en utilisant les taux actuels (pas historiques pour l'affichage)
  const convertWithCurrentRate = (
    paymentAmount: number, 
    paymentCurrency: string, 
    targetCurrency: string
  ) => {
    // Si les devises sont identiques, retourner tel quel
    if (paymentCurrency === targetCurrency || 
        (paymentCurrency === 'Ar' && targetCurrency === 'MGA') ||
        (paymentCurrency === 'MGA' && targetCurrency === 'Ar')) {
      return paymentAmount
    }

    // Normaliser les devises
    const sourceCurrency = (paymentCurrency === 'Ar') ? 'MGA' : paymentCurrency
    const destCurrency = (targetCurrency === 'Ar') ? 'MGA' : targetCurrency

    // Convertir via MGA comme devise de base
    if (sourceCurrency === 'MGA') {
      // De MGA vers autre devise
      const targetRate = currentRates[destCurrency] || 1
      return paymentAmount * targetRate
    } else if (destCurrency === 'MGA') {
      // D'autre devise vers MGA
      const sourceRate = currentRates[sourceCurrency] || 1
      return paymentAmount / sourceRate
    } else {
      // Entre deux devises non-MGA : passer par MGA
      const sourceRate = currentRates[sourceCurrency] || 1
      const targetRate = currentRates[destCurrency] || 1
      const amountInMGA = paymentAmount / sourceRate
      return amountInMGA * targetRate
    }
  }

  // Obtenir le symbole pour une devise
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      'MGA': 'Ar',
      'Ar': 'Ar',
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CAD': 'CA$',
      'CHF': 'CHF'
    }
    return symbols[currencyCode] || currencyCode
  }

  // Calculer le montant dans la devise sélectionnée
  const getDisplayAmount = () => {
    const activeCurrency = targetCurrency || 'Ar'
    const sourceCurrency = currency === 'Ar' ? 'MGA' : currency
    
    // PRIORITÉ 1: Utiliser les taux historiques stockés si disponibles
    if (paymentExchangeRate && 
        paymentExchangeRate !== 1 && 
        originalAmount && 
        paymentDisplayCurrency === activeCurrency) {
      
      // Ce paiement a été fait dans la devise d'affichage actuelle
      // Utiliser le montant original stocké
      return {
        amount: originalAmount,
        symbol: getCurrencySymbol(activeCurrency),
        isHistorical: true
      }
    }
    
    // PRIORITÉ 2: Utiliser les taux actuels pour la conversion d'affichage
    const convertedAmount = convertWithCurrentRate(
      amount,
      sourceCurrency,
      activeCurrency
    )
    
    return {
      amount: convertedAmount,
      symbol: getCurrencySymbol(activeCurrency),
      isHistorical: false
    }
  }

  const { amount: displayAmount, symbol, isHistorical } = getDisplayAmount()

  // Formatage du montant
  const formatAmount = (value: number) => {
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  return (
    <span>
      {formatAmount(displayAmount)} {symbol}
      {isHistorical && <span className="text-xs text-muted-foreground ml-1">🔒</span>}
    </span>
  )
}
