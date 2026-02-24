import React from 'react';
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import { Eye, Pencil, ShoppingCart, ArrowLeft, Edit2, User, Package, CreditCard } from 'lucide-react'
import OrderStatusBadge from '@/components/admin/orders/order-status-badge'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { InvoiceGeneratorButton } from '@/components/admin/orders/invoice-generator'
import { OrderEditClient } from '@/components/admin/orders/order-edit-client'

interface PageProps {
  params: {
    id: string
  }
}

// Interface pour les paiements
interface Payment {
  id: string;
  amount: any;
  currency: string;
  method: string;
  provider: string | null;
  transactionId: string | null;
  reference: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  processedByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

// Étendre l'interface Order pour inclure le champ orderNumber et les paiements
interface OrderWithDetails {
  id: string;
  orderNumber?: string;
  status: string;
  paymentStatus: string;
  currency: string;
  total: any;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    phone?: string | null;
  };
  items: Array<any>;
  payments: Payment[];
  subscriptions: Array<any>;
  shippingAddress?: any;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const orderData = await prisma.order.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!orderData) {
    return {
      title: 'Commande non trouvée',
    }
  }

  // Utiliser l'assertion de type
  const order = orderData as unknown as OrderWithDetails;

  return {
    title: `Commande de ${order.user.firstName} ${order.user.lastName}`,
    description: `Détails de la commande ${order.orderNumber || '#' + order.id.substring(0, 8)}`,
  }
}

async function getOrder(id: string): Promise<OrderWithDetails> {
  const orderData = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          offer: true,
          product: true,
          service: true,
        },
      },
      payments: {
        include: {
          processedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      subscriptions: {
        include: {
          offer: true,
          platformOffer: {
            include: {
              platform: true,
            },
          },
        },
      },
      shippingAddress: true,
      billingAddress: true,
    }
  });

  if (!orderData) {
    notFound();
  }

  // Convertir les Decimal en nombres et formater les dates
  return {
    ...orderData,
    total: Number(orderData.total),
    createdAt: orderData.createdAt.toISOString(),
    updatedAt: orderData.updatedAt.toISOString(),
    items: orderData.items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discountValue: item.discountValue ? Number(item.discountValue) : null,
      discountAmount: item.discountAmount ? Number(item.discountAmount) : null,
      metadata: item.metadata, // Préserver les métadonnées
    })),
    payments: orderData.payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount),
      createdAt: payment.createdAt.toISOString(),
    })),
    subscriptions: orderData.subscriptions.map((sub: any) => ({
      ...sub,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
    })),
  } as unknown as OrderWithDetails;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">En attente</Badge>
    case 'PAID':
      return <Badge variant="success">Payé</Badge>
    case 'SHIPPED':
      return <Badge variant="default">Expédié</Badge>
    case 'DELIVERED':
      return <Badge variant="outline">Livré</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive">Annulé</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default async function OrderPage({ params }: PageProps) {
  const order = await getOrder(params.id)

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Commande non trouvée. L'identifiant {params.id} n'existe pas ou la commande a été supprimée.
        </div>
        <div className="mt-4">
          <Link href="/admin/orders" className="text-blue-600 flex items-center gap-2">
            <ArrowLeft size={16} />
            <span>Retour à la liste des commandes</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            Détails de la commande {order.orderNumber || '#' + order.id.substring(0, 8)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceGeneratorButton orderId={order.id} />
          <Link 
            href={`/admin/orders/${order.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition">
            <Edit2 size={18} />
            <span>Modifier</span>
          </Link>
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <User className="h-5 w-5" />
            Information du client
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium">Nom: </span>
              {order.user.firstName} {order.user.lastName}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Email: </span>
              {order.user.email}
            </p>
            {order.user.phone && (
              <p className="text-gray-600">
                <span className="font-medium">Téléphone: </span>
                {order.user.phone}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Détails de la commande
          </h2>
          <div className="space-y-3">
            {order.orderNumber && (
              <p className="text-gray-600">
                <span className="font-medium">Numéro: </span>
                {order.orderNumber}
              </p>
            )}
            <p className="text-gray-600">
              <span className="font-medium">Statut: </span>
              <OrderStatusBadge status={order.status} />
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Paiement: </span>
              <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                {order.paymentStatus === 'PAID' ? 'Payé' : 
                 order.paymentStatus === 'PARTIALLY_PAID' ? 'Partiel' : 'En attente'}
              </Badge>
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Date: </span>
              {new Date(order.createdAt).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Récapitulatif
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium">Articles: </span>
              {order.items.length}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Produits: </span>
              {order.items.filter(item => item.itemType === 'PRODUCT').length}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Abonnements: </span>
              {order.subscriptions?.length || 0}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Paiements: </span>
              {order.payments?.length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Financier
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium">Total: </span>
              <span className="text-lg font-semibold text-green-600">
                <PriceDisplay price={Number(order.total)} size="large" />
              </span>
            </p>
            {(order as any).globalDiscountAmount && Number((order as any).globalDiscountAmount) > 0 && (
              <p className="text-green-600">
                <span className="font-medium">Réduction globale: </span>
                -{Number((order as any).globalDiscountAmount).toLocaleString('fr-FR')} Ar
              </p>
            )}
            {order.payments && order.payments.length > 0 && (
              <p className="text-blue-600">
                <span className="font-medium">Payé: </span>
                {order.payments
                  .filter(p => p.status === 'COMPLETED')
                  .reduce((sum, p) => sum + Number(p.amount), 0)
                  .toLocaleString('fr-FR')} Ar
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <h2 className="text-lg font-semibold p-6 border-b">Produits et services commandés</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix unitaire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réduction
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => {
                let itemName = 'Inconnu';
                if (item.product) itemName = item.product.name;
                if (item.service) itemName = item.service.name;
                if (item.offer) itemName = item.offer.name;
                
                // Vérifier les métadonnées pour les produits importés
                if (itemName === 'Inconnu' && item.metadata) {
                  try {
                    const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                    if (metadata?.name) {
                      itemName = metadata.name;
                    }
                  } catch (e) {
                    // Ignorer les erreurs de parsing
                  }
                }

                const hasDiscount = (item as any).discountAmount && Number((item as any).discountAmount) > 0;
                const originalPrice = Number(item.unitPrice) * item.quantity;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Badge variant="secondary" className="text-xs">
                        {item.itemType === 'PRODUCT' && 'Produit'}
                        {item.itemType === 'SERVICE' && 'Service'}
                        {item.itemType === 'OFFER' && 'Abonnement'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriceWithConversion price={Number(item.unitPrice)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {hasDiscount ? (
                        <div className="space-y-1">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {(item as any).discountType === 'PERCENTAGE' 
                              ? `${(item as any).discountValue}%` 
                              : `${Number((item as any).discountValue).toLocaleString('fr-FR')} Ar`
                            }
                          </Badge>
                          <p className="text-xs text-green-600">
                            -{Number((item as any).discountAmount).toLocaleString('fr-FR')} Ar
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Aucune</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {hasDiscount ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 line-through">
                            {originalPrice.toLocaleString('fr-FR')} Ar
                          </p>
                          <p className="text-green-600 font-semibold">
                            <PriceWithConversion price={Number(item.totalPrice)} />
                          </p>
                        </div>
                      ) : (
                        <PriceWithConversion price={Number(item.totalPrice)} />
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-4 text-right text-sm font-semibold">
                  Total de la commande:
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                  <PriceWithConversion price={Number(order.total)} />
                </td>
              </tr>
              
              {/* Ligne pour la réduction globale si elle existe */}
              {(order as any).globalDiscountAmount && Number((order as any).globalDiscountAmount) > 0 && (
                <tr className="bg-green-50">
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-semibold text-green-700">
                    Réduction globale 
                    {(order as any).globalDiscountType === 'PERCENTAGE' 
                      ? ` (${(order as any).globalDiscountValue}%)` 
                      : ` (${Number((order as any).globalDiscountValue).toLocaleString('fr-FR')} Ar)`
                    }:
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    -{Number((order as any).globalDiscountAmount).toLocaleString('fr-FR')} Ar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {order.subscriptions && order.subscriptions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <h2 className="text-lg font-semibold p-6 border-b">Abonnements associés</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date début
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date fin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscription.offer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={subscription.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section de gestion des paiements */}
      <OrderEditClient 
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          currency: order.currency,
          total: Number(order.total),
          payments: order.payments.map(payment => ({
            ...payment,
            amount: Number(payment.amount),
            createdAt: payment.createdAt.toISOString(),
          })),
          user: {
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email || '',
          },
        }}
      />
      </div>
    </div>
  )
} 