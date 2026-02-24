'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Gift } from 'lucide-react'
import { useCurrency } from '@/lib/contexts/currency-context'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  type?: string
  platform?: {
    name: string
    logo: string | null
  }
  duration?: string
}

interface PromoCode {
  id: string
  code: string
  name: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'
  value: number
}

interface OrderSummaryProps {
  items: OrderItem[]
  appliedPromo?: PromoCode | null
  discountAmount?: number
  shippingCost?: number
  freeShipping?: boolean
}

export function OrderSummary({
  items,
  appliedPromo,
  discountAmount = 0,
  shippingCost = 0,
  freeShipping = false
}: OrderSummaryProps) {
  const { formatWithTargetCurrency } = useCurrency()

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const actualShippingCost = freeShipping ? 0 : shippingCost
  const total = subtotal - discountAmount + actualShippingCost

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Résumé de commande
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Articles */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                {item.platform && (
                  <p className="text-xs text-gray-500">{item.platform.name}</p>
                )}
                {item.duration && (
                  <Badge variant="outline" className="text-xs">
                    {item.duration}
                  </Badge>
                )}
                <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
              </div>
              <p className="font-medium">
                {formatWithTargetCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Sous-total */}
        <div className="flex justify-between">
          <span>Sous-total</span>
          <span>{formatWithTargetCurrency(subtotal)}</span>
        </div>

        {/* Code promo appliqué */}
        {appliedPromo && (
          <div className="flex justify-between text-green-600">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="text-sm">{appliedPromo.code}</span>
            </div>
            <span>-{formatWithTargetCurrency(discountAmount)}</span>
          </div>
        )}

        {/* Frais de livraison */}
        <div className="flex justify-between">
          <span>Livraison</span>
          <span className={freeShipping ? "text-green-600" : ""}>
            {freeShipping ? "Gratuite" : formatWithTargetCurrency(actualShippingCost)}
          </span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatWithTargetCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
