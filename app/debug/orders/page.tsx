import React from 'react';
import Link from 'next/link';
import { Order } from '@/types/order';

// Force dynamic rendering to avoid URL parsing errors during static generation
export const dynamic = 'force-dynamic'

async function getOrders(): Promise<Order[]> {
  try {
    // Utiliser notre API de débogage pour récupérer les commandes
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3000'
    const res = await fetch(`${baseUrl}/api/debug/direct-orders`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error(`Erreur API débogage: ${res.status}`);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes debug:', error);
    return [];
  }
}

export default async function DebugOrdersPage() {
  const orders = await getOrders();
  const ordersCount = Array.isArray(orders) ? orders.length : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Page de débogage - Commandes</h1>
        <p className="text-muted-foreground">Cette page affiche les commandes en contournant l'authentification</p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
        <div>Nombre de commandes trouvées: {ordersCount}</div>
        <div className="mt-2">
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            Retour à la page d'administration
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user?.firstName || 'N/A'} {order.user?.lastName || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Number(order.total).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items?.length || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 