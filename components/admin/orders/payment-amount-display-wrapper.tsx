'use client'

import { PaymentAmountDisplay } from './payment-amount-display'

interface PaymentAmountDisplayWrapperProps {
  amount: number
  currency: string
  originalAmount?: number
  paymentExchangeRate?: number
  paymentDisplayCurrency?: string
}

export function PaymentAmountDisplayWrapper(props: PaymentAmountDisplayWrapperProps) {
  return <PaymentAmountDisplay {...props} />
}
