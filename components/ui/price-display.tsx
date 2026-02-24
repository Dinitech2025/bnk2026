'use client'

import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'

interface PriceDisplayProps {
  price: number
  comparePrice?: number | null
  size?: 'small' | 'medium' | 'large'
  showDiscount?: boolean
  className?: string
  defaultCurrency?: string
}

/**
 * Composant réutilisable pour afficher les prix avec conversion de devise
 * à utiliser partout dans l'application pour les produits, services et offres
 */
export function PriceDisplay({ 
  price, 
  comparePrice, 
  size = 'medium', 
  showDiscount = true,
  className = '',
  defaultCurrency = 'MGA'  // Utiliser MGA comme devise par défaut
}: PriceDisplayProps) {
  // Calcul de la réduction en pourcentage
  const hasDiscount = comparePrice && comparePrice > price
  const discountPercentage = hasDiscount 
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0
    
  // Classes en fonction de la taille
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl'
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`font-medium ${sizeClasses[size]}`}>
        <PriceWithConversion price={price} defaultCurrency={defaultCurrency} />
      </div>
      
      {hasDiscount && (
        <>
          <div className="text-sm text-gray-500 line-through">
            <PriceWithConversion price={comparePrice} defaultCurrency={defaultCurrency} />
          </div>
          
          {showDiscount && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800">
              -{discountPercentage}%
            </span>
          )}
        </>
      )}
    </div>
  )
} 
 
 
 
 
 
 