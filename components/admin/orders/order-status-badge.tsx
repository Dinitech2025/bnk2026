import React from 'react';

interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  // Déterminer les classes de style en fonction du statut
  const getStatusClasses = () => {
    switch (status) {
      case 'QUOTE':
      case 'WAITING_PAYMENT':
        return 'bg-gray-100 text-gray-800';
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800';
      case 'PARTIALLY_PAID':
        return 'bg-orange-100 text-orange-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPING':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'FINISHED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-violet-100 text-violet-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Traduire le statut en français (cohérent avec la liste déroulante)
  const getStatusText = () => {
    switch (status) {
      case 'QUOTE':
      case 'WAITING_PAYMENT':
        return 'Devis en attente de paiement';
      case 'PAID':
        return 'Payée';
      case 'PARTIALLY_PAID':
        return 'Payée partiellement';
      case 'CONFIRMED': // Ancienne valeur pour compatibilité
        return 'Payée';
      case 'PENDING':
        return 'En attente';
      case 'PROCESSING':
        return 'En traitement';
      case 'SHIPPING':
        return 'En livraison';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
      case 'FINISHED':
        return 'Terminée';
      case 'COMPLETED':
        return 'Terminée';
      case 'SHIPPED':
        return 'Expédiée';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses()}`}>
      {getStatusText()}
    </span>
  );
} 