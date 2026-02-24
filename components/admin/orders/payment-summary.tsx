'use client'

import { useCurrency } from '@/components/providers/currency-provider'
import { getCurrencySymbol } from '@/lib/utils/currency-symbols'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentExchangeRate?: number | null
  paymentBaseCurrency?: string | null
  paymentDisplayCurrency?: string | null
  originalAmount?: number | null
}

interface PaymentSummaryProps {
  payments: Payment[]
  orderTotal: number
  orderCurrency: string
  orderExchangeRates?: string | null // JSON string des taux enregistrés
  orderDisplayCurrency?: string | null
  orderExchangeRate?: number | null
}

export function PaymentSummary({ 
  payments, 
  orderTotal, 
  orderCurrency, 
  orderExchangeRates, 
  orderDisplayCurrency, 
  orderExchangeRate 
}: PaymentSummaryProps) {
  const { targetCurrency } = useCurrency()

  // Taux de change actuels (même logique que PaymentAmountDisplay)
  const currentRates = {
    'MGA': 1.0,
    'Ar': 1.0,
    'EUR': 0.000196,  // 1 MGA = 0.000196 EUR
    'USD': 0.000214,  // 1 MGA = 0.000214 USD
    'GBP': 0.000168   // 1 MGA = 0.000168 GBP
  }

  // Fonction de conversion (même logique que PaymentAmountDisplay)
  const convertWithCurrentRate = (paymentAmount: number, paymentCurrency: string, targetCurrency: string) => {
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

  // Helper pour formater les prix avec conversion
  const formatPrice = (price: number, fromCurrency: string = orderCurrency) => {
    const displayCurrency = targetCurrency || 'Ar'
    
    if (displayCurrency === fromCurrency || 
        (displayCurrency === 'Ar' && fromCurrency === 'MGA') ||
        (displayCurrency === 'MGA' && fromCurrency === 'Ar')) {
      return `${price.toLocaleString()} ${getCurrencySymbol(displayCurrency)}`
    }
    
    const convertedPrice = convertWithCurrentRate(price, fromCurrency, displayCurrency)
    return `${convertedPrice.toLocaleString()} ${getCurrencySymbol(displayCurrency)}`
  }

  // Calculer les totaux
  const totalPaid = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const remaining = Math.max(0, orderTotal - totalPaid)

  return (
    <div className="pt-2 border-t">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total payé:</span>
          <span className="font-medium">{formatPrice(totalPaid, orderCurrency)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Restant:</span>
            <span className="font-medium text-orange-600">{formatPrice(remaining, orderCurrency)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t">
          <span className="text-muted-foreground">Total commande:</span>
          <span className="font-semibold">{formatPrice(orderTotal, orderCurrency)}</span>
        </div>
      </div>
    </div>
  )
}
