'use client'

import { useCurrency } from '@/components/providers/currency-provider'
import { convertCurrency, defaultExchangeRates } from '@/lib/utils'

interface RevenueDisplayProps {
  totalRevenueAr: number
  totalRevenueUSD: number
  totalRevenueEUR: number
}

export function RevenueDisplay({ totalRevenueAr, totalRevenueUSD, totalRevenueEUR }: RevenueDisplayProps) {
  const { targetCurrency, exchangeRates } = useCurrency()

  // Fonction helper pour convertir entre devises
  const convertPrice = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount
    
    // Utiliser les taux de change du contexte ou les taux par défaut
    const rates = Object.keys(exchangeRates).length > 3 ? exchangeRates : defaultExchangeRates
    
    try {
      return convertCurrency(amount, fromCurrency, toCurrency, rates)
    } catch (error) {
      console.error('Erreur de conversion:', error)
      return amount
    }
  }

  // Calculer le CA total dans la devise sélectionnée
  const getTotalRevenue = () => {
    const activeCurrency = targetCurrency || 'Ar'
    
    switch (activeCurrency) {
      case 'USD':
        // Convertir tout en USD
        const arToUSD = convertPrice(totalRevenueAr, 'MGA', 'USD')
        const eurToUSD = convertPrice(totalRevenueEUR, 'EUR', 'USD')
        const revenueInUSD = totalRevenueUSD + arToUSD + eurToUSD
        return { amount: revenueInUSD, symbol: '$' }
      
      case 'EUR':
        // Convertir tout en EUR
        const arToEUR = convertPrice(totalRevenueAr, 'MGA', 'EUR')
        const usdToEUR = convertPrice(totalRevenueUSD, 'USD', 'EUR')
        const revenueInEUR = totalRevenueEUR + arToEUR + usdToEUR
        return { amount: revenueInEUR, symbol: '€' }
      
      case '£':
      case 'GBP':
        // Convertir tout en GBP
        const arToGBP = convertPrice(totalRevenueAr, 'MGA', 'GBP')
        const usdToGBP = convertPrice(totalRevenueUSD, 'USD', 'GBP')
        const eurToGBP = convertPrice(totalRevenueEUR, 'EUR', 'GBP')
        const revenueInGBP = arToGBP + usdToGBP + eurToGBP
        return { amount: revenueInGBP, symbol: '£' }
      
      default: // 'Ar' ou 'MGA'
        // Convertir tout en Ariary (déjà calculé côté serveur)
        const usdToAr = convertPrice(totalRevenueUSD, 'USD', 'MGA')
        const eurToAr = convertPrice(totalRevenueEUR, 'EUR', 'MGA')
        const totalInAr = totalRevenueAr + usdToAr + eurToAr
        return { amount: totalInAr, symbol: 'Ar' }
    }
  }

  const { amount, symbol } = getTotalRevenue()

  // Formatage intelligent selon la taille
  const formatAmount = (value: number) => {
    const absValue = Math.abs(value)
    
    if (absValue >= 1000000000) {
      // Milliards
      return `${(value / 1000000000).toFixed(1)}B`
    } else if (absValue >= 1000000) {
      // Millions
      return `${(value / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      // Milliers
      return `${(value / 1000).toFixed(1)}K`
    } else {
      // Unités
      return Math.round(value).toString()
    }
  }

  return (
    <span>
      {formatAmount(amount)} {symbol}
    </span>
  )
}
