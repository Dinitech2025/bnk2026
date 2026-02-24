'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Pencil, 
  Trash, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Play,
  MessageCircle,
  MessageSquare,
  Send,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface ClientCardProps {
  client: {
    id: string
    firstName?: string | null
    lastName?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    image?: string | null
    customerType?: string
    companyName?: string | null
    communicationMethod?: string | null
    facebookPage?: string | null
    whatsappNumber?: string | null
    telegramUsername?: string | null
    addresses: any[]
    orders: any[]
    subscriptions: any[]
    totalSpent: number
  }
  currency: string
  currencySymbol: string
}

export function ClientCard({ client, currency, currencySymbol }: ClientCardProps) {
  const getDisplayName = () => {
    if (client.firstName && client.lastName) {
      return `${client.firstName} ${client.lastName}`
    }
    return client.name || client.email || client.phone || 'Sans nom'
  }

  const getInitials = () => {
    return client.firstName?.charAt(0) || 
           client.email?.charAt(0)?.toUpperCase() || 
           client.phone?.charAt(0) || 
           'C'
  }

  const getCommunicationIcon = () => {
    switch (client.communicationMethod) {
      case 'EMAIL': return <Mail className="h-3 w-3" />
      case 'WHATSAPP': return <MessageCircle className="h-3 w-3" />
      case 'SMS': return <MessageSquare className="h-3 w-3" />
      case 'FACEBOOK': return <MessageSquare className="h-3 w-3" />
      case 'TELEGRAM': return <Send className="h-3 w-3" />
      default: return null
    }
  }

  const getCommunicationLabel = () => {
    switch (client.communicationMethod) {
      case 'EMAIL': return 'Email'
      case 'WHATSAPP': return 'WhatsApp'
      case 'SMS': return 'SMS'
      case 'FACEBOOK': return `Facebook: ${client.facebookPage || 'Non spécifié'}`
      case 'TELEGRAM': return `Telegram: ${client.telegramUsername || 'Non spécifié'}`
      default: return null
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      {/* En-tête avec photo et nom */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {client.image ? (
            <img
              src={client.image}
              alt={getDisplayName()}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
              {getInitials()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">
              {getDisplayName()}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {client.email || (client.phone ? `Tél: ${client.phone}` : 'Pas d\'email')}
            </p>
          </div>
        </div>
        
        {/* Actions directes */}
        <div className="flex space-x-1">
          <Link 
            href={`/admin/clients/${client.id}`}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Voir les détails"
          >
            <Eye className="h-3.5 w-3.5 text-gray-700" />
          </Link>
          <Link 
            href={`/admin/clients/${client.id}/edit`}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Modifier"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-700" />
          </Link>
          <Link 
            href={`/admin/clients/${client.id}/delete`}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Supprimer"
          >
            <Trash className="h-3.5 w-3.5 text-gray-700" />
          </Link>
        </div>
      </div>

      {/* Type de client */}
      <div className="flex items-center justify-between">
        <Badge variant={client.customerType === 'BUSINESS' ? 'default' : 'secondary'}>
          {client.customerType === 'BUSINESS' ? 'Entreprise' : 'Particulier'}
        </Badge>
        {client.customerType === 'BUSINESS' && client.companyName && (
          <div className="flex items-center text-xs text-gray-500">
            <Briefcase className="h-3 w-3 mr-1" />
            <span className="truncate max-w-24">{client.companyName}</span>
          </div>
        )}
      </div>

      {/* Informations de contact */}
      <div className="space-y-1">
        {client.email && (
          <div className="flex items-center text-xs text-gray-600">
            <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
            <span className="truncate">{client.phone}</span>
          </div>
        )}
        {client.communicationMethod && (
          <div className="flex items-center text-xs text-gray-600">
            {getCommunicationIcon()}
            <span className="ml-2 truncate">{getCommunicationLabel()}</span>
          </div>
        )}
        <div className="flex items-center text-xs text-gray-600">
          <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
          <span>{client.addresses.length} {client.addresses.length > 1 ? 'adresses' : 'adresse'}</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-600 mb-1">
            <ShoppingBag className="h-3 w-3 mr-1" />
            <span className="text-sm font-medium">{client.orders.length}</span>
          </div>
          <div className="text-xs text-gray-500">Commandes</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-600 mb-1">
            <Play className="h-3 w-3 mr-1" />
            <span className="text-sm font-medium">{client.subscriptions.length}</span>
          </div>
          <div className="text-xs text-gray-500">Abonnements</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-800 mb-1">
            {formatPrice(client.totalSpent, currency, currencySymbol)}
          </div>
          <div className="text-xs text-gray-500">Total dépensé</div>
        </div>
      </div>
    </div>
  )
} 