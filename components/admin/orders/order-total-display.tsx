'use client'

import { useCurrency } from '@/lib/contexts/currency-context'
import { getCurrencySymbol } from '@/lib/utils/currency-symbols'

interface OrderTotalDisplayProps {
  price: number
  currency?: string
  exchangeRates?: string | null // JSON des taux enregistrés de la commande
  displayCurrency?: string | null
  exchangeRate?: number | null
  // Taux de paiement (prioritaire sur les taux de commande)
  payments?: Array<{
    paymentExchangeRate?: number | null
    paymentDisplayCurrency?: string | null
    paymentBaseCurrency?: string | null
    status: string
  }>
}

export function OrderTotalDisplay({ 
  price, 
  currency = 'Ar', 
  exchangeRates, 
  displayCurrency, 
  exchangeRate,
  payments = []
}: OrderTotalDisplayProps) {
  const { currency: baseCurrency, targetCurrency, exchangeRates: currentRates } = useCurrency()

  // Si la devise sélectionnée est Ar/MGA, afficher seulement le prix original
  if (targetCurrency === 'Ar' || targetCurrency === 'MGA' || !targetCurrency || targetCurrency === baseCurrency) {
    return (
      <div className="font-semibold text-right">
        {price.toLocaleString()} {getCurrencySymbol('Ar')}
      </div>
    )
  }

  // Calculer le prix converti
  let convertedPrice = price
  let usedStoredRate = false
  let rateSource = 'current' // 'payment', 'order', 'current'

  // PRIORITÉ 1: Utiliser le taux de paiement si disponible (plus précis)
  const completedPayment = payments.find(p => 
    p.status === 'COMPLETED' && 
    p.paymentExchangeRate && 
    p.paymentDisplayCurrency === targetCurrency
  )

  if (completedPayment && completedPayment.paymentExchangeRate) {
    convertedPrice = price * completedPayment.paymentExchangeRate
    usedStoredRate = true
    rateSource = 'payment'
  }
  // PRIORITÉ 2: Utiliser le taux de commande si pas de paiement
  else if (exchangeRate && displayCurrency === targetCurrency) {
    convertedPrice = price * exchangeRate
    usedStoredRate = true
    rateSource = 'order'
  }
  // PRIORITÉ 3: Utiliser les taux actuels
  else {
    const rate = currentRates[targetCurrency]
    if (rate) {
      convertedPrice = price * rate
    }
    rateSource = 'current'
  }

  return (
    <div className="font-semibold text-right">
      {/* Prix converti */}
      <div className="flex items-center justify-end gap-1">
        <span>{convertedPrice.toLocaleString()} {getCurrencySymbol(targetCurrency)}</span>
        {usedStoredRate && (
          <span className="text-xs" title={`Taux figé (${rateSource === 'payment' ? 'paiement' : 'commande'})`}>
            🔒
          </span>
        )}
      </div>
      
      {/* Prix original en Ar en petit */}
      <div className="text-xs text-muted-foreground font-normal mt-0.5 text-right">
        {price.toLocaleString()} {getCurrencySymbol('Ar')}
      </div>
      
      {/* Debug: source du taux (à supprimer en production) */}
      {process.env.NODE_ENV === 'development' && usedStoredRate && (
        <div className="text-xs text-blue-500 font-normal text-right">
          {rateSource === 'payment' ? '💳 Taux paiement' : '📋 Taux commande'}
        </div>
      )}
    </div>
  )
}
