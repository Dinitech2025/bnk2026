// Traductions des statuts de commande
export const orderStatusTranslations: Record<string, string> = {
  // Statuts de commande
  'PENDING': 'En attente',
  'PARTIALLY_PAID': 'Payée partiellement',
  'PAID': 'Payée',
  'PROCESSING': 'En cours de traitement',
  'SHIPPED': 'Expédiée',
  'DELIVERED': 'Livrée',
  'CANCELLED': 'Annulée',
  'REFUNDED': 'Remboursée',
  'QUOTE': 'Devis',
  
  // Ancienne valeur pour compatibilité
  'CONFIRMED': 'Payée',
  
  // Statuts de paiement
  'UNPAID': 'Non payée',
  'PAID': 'Payée',
  'PARTIALLY_PAID': 'Partiellement payée',
  'REFUNDED': 'Remboursée',
  'FAILED': 'Échec du paiement',
  
  // Anciens statuts (pour compatibilité)
  'Payée': 'Payée',
  'Devis en attente de paiement': 'Devis en attente de paiement',
  'Annulée': 'Annulée',
  'En cours': 'En cours',
  'Completed': 'Terminée',
  'Pending': 'En attente'
}

export const paymentStatusTranslations: Record<string, string> = {
  'UNPAID': 'Non payé',
  'PAID': 'Payé',
  'PARTIALLY_PAID': 'Partiellement payé',
  'REFUNDED': 'Remboursé',
  'FAILED': 'Échec',
  'PENDING': 'En attente'
}

export function translateOrderStatus(status: string): string {
  return orderStatusTranslations[status] || status
}

export function translatePaymentStatus(status: string): string {
  return paymentStatusTranslations[status] || status
}

// Couleurs pour les statuts
export function getOrderStatusColor(status: string): string {
  const normalizedStatus = status.toUpperCase()
  
  switch (normalizedStatus) {
    case 'PAID':
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    case 'CONFIRMED': // Ancienne valeur pour compatibilité
      return 'bg-green-100 text-green-800'
    case 'PENDING':
    case 'QUOTE':
    case 'UNPAID':
      return 'bg-yellow-100 text-yellow-800'
    case 'PARTIALLY_PAID':
      return 'bg-orange-100 text-orange-800'
    case 'CANCELLED':
    case 'REFUNDED':
    case 'FAILED':
      return 'bg-red-100 text-red-800'
    case 'PROCESSING':
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getPaymentStatusColor(status: string): string {
  const normalizedStatus = status.toUpperCase()
  
  switch (normalizedStatus) {
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'PENDING':
    case 'UNPAID':
      return 'bg-yellow-100 text-yellow-800'
    case 'FAILED':
    case 'REFUNDED':
      return 'bg-red-100 text-red-800'
    case 'PARTIALLY_PAID':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

