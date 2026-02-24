'use client'

import { PriceDisplay } from "@/components/ui/price-display"

interface OfferPriceProps {
  price: number
}

export function OfferPrice({ price }: OfferPriceProps) {
  return (
    <span className="text-2xl font-bold">
      <PriceDisplay price={price} size="large" />
    </span>
  )
} 
 
 
 
 
 
 