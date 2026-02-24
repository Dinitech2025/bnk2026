'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Tag, 
  Check, 
  X, 
  Loader2,
  Gift,
  Percent,
  Truck
} from 'lucide-react'
import { toast } from 'sonner'

interface PromoCode {
  id: string
  code: string
  name: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  description?: string
}

interface PromoCodeInputProps {
  subtotal: number
  onPromoApplied: (promo: PromoCode, discountAmount: number) => void
  onPromoRemoved: () => void
  appliedPromo?: PromoCode | null
  discountAmount?: number
}

export function PromoCodeInput({ 
  subtotal, 
  onPromoApplied, 
  onPromoRemoved, 
  appliedPromo,
  discountAmount = 0
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Veuillez saisir un code promo')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          cartTotal: subtotal
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        const calculatedDiscount = calculateDiscount(data.promotion, subtotal)
        onPromoApplied(data.promotion, calculatedDiscount)
        toast.success(`Code promo "${data.promotion.code}" appliqué !`)
        setPromoCode('')
      } else {
        toast.error(data.error || 'Code promo invalide')
      }
    } catch (error) {
      console.error('Erreur validation promo:', error)
      toast.error('Erreur lors de la validation du code promo')
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscount = (promo: PromoCode, orderAmount: number): number => {
    switch (promo.type) {
      case 'PERCENTAGE':
        const percentDiscount = (orderAmount * promo.value) / 100
        return promo.maxDiscountAmount 
          ? Math.min(percentDiscount, promo.maxDiscountAmount)
          : percentDiscount
      
      case 'FIXED_AMOUNT':
        return Math.min(promo.value, orderAmount)
      
      case 'FREE_SHIPPING':
        // Pour la livraison gratuite, on retournera le montant de livraison
        // Pour l'instant, on retourne 0 car on n'a pas encore le coût de livraison
        return 0
      
      case 'BUY_X_GET_Y':
        // Logique à implémenter selon les besoins spécifiques
        return 0
      
      default:
        return 0
    }
  }

  const removePromoCode = () => {
    onPromoRemoved()
    toast.info('Code promo retiré')
  }

  const getPromoIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />
      case 'FIXED_AMOUNT':
        return <Gift className="h-4 w-4" />
      case 'FREE_SHIPPING':
        return <Truck className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const getPromoDescription = (promo: PromoCode) => {
    switch (promo.type) {
      case 'PERCENTAGE':
        return `${promo.value}% de réduction${promo.maxDiscountAmount ? ` (max ${promo.maxDiscountAmount.toLocaleString()} Ar)` : ''}`
      case 'FIXED_AMOUNT':
        return `${promo.value.toLocaleString()} Ar de réduction`
      case 'FREE_SHIPPING':
        return 'Livraison gratuite'
      case 'BUY_X_GET_Y':
        return promo.description || 'Offre spéciale'
      default:
        return promo.description || 'Réduction appliquée'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Code promo appliqué */}
          {appliedPromo && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPromoIcon(appliedPromo.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-800">
                        {appliedPromo.code}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {appliedPromo.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-green-600">
                      {getPromoDescription(appliedPromo)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-800">
                    -{discountAmount.toLocaleString()} Ar
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removePromoCode}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Saisie du code promo */}
          {!appliedPromo && (
            <div className="space-y-3">
              <Label htmlFor="promoCode" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Code promo (optionnel)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Saisissez votre code promo"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      validatePromoCode()
                    }
                  }}
                />
                <Button
                  onClick={validatePromoCode}
                  disabled={loading || !promoCode.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Les codes promo sont appliqués automatiquement lors de la validation
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}