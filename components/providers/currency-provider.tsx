'use client'

import { CurrencyProvider, useCurrency } from '@/lib/contexts/currency-context'

export function CurrencyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  )
}

// Re-export the hook for convenience
export { useCurrency } 
 
 
 
 
 