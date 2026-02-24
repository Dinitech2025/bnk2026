'use client'

import { Shield, CheckCircle, Building } from 'lucide-react'

interface SecurityBadgeProps {
  variant?: 'default' | 'checkout' | 'forms'
  className?: string
}

export function SecurityBadge({ variant = 'default', className = '' }: SecurityBadgeProps) {
  const badges = {
    default: {
      icon: Shield,
      text: '🛡️ Site e-commerce sécurisé',
      subtext: 'Vos données sont protégées',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    checkout: {
      icon: CheckCircle,
      text: '✅ Paiement 100% sécurisé',
      subtext: 'Cryptage SSL • Données protégées',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200', 
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    forms: {
      icon: Building,
      text: '🏢 Boutique officielle Madagascar',
      subtext: 'Site professionnel certifié',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600'
    }
  }

  const config = badges[variant]
  const Icon = config.icon

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-2 rounded-lg border
      ${config.bgColor} ${config.borderColor} ${className}
    `}>
      <Icon className={`h-4 w-4 ${config.iconColor}`} />
      <div>
        <p className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </p>
        <p className={`text-xs ${config.textColor} opacity-75`}>
          {config.subtext}
        </p>
      </div>
    </div>
  )
}

export function SecurityBadgeRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <SecurityBadge variant="default" />
      <SecurityBadge variant="checkout" />
      <SecurityBadge variant="forms" />
    </div>
  )
}
