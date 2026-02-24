'use client'

import { PaymentSummary } from './payment-summary'

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

interface PaymentSummaryWrapperProps {
  payments: Payment[]
  orderTotal: number
  orderCurrency: string
  orderExchangeRates?: string | null
  orderDisplayCurrency?: string | null
  orderExchangeRate?: number | null
}

export function PaymentSummaryWrapper(props: PaymentSummaryWrapperProps) {
  return <PaymentSummary {...props} />
}
