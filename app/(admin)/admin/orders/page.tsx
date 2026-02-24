import React, { Suspense } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { EnhancedOrdersList } from '@/components/admin/orders/enhanced-orders-list';
import OrdersLoading from './loading';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Désactiver le cache pour avoir les données en temps réel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Type pour les données après conversion des Decimal en number
type OrderWithConvertedPrices = Omit<OrderWithRelations, 'total' | 'items' | 'user' | 'createdAt' | 'updatedAt' | 'payments' | 'exchangeRate' | 'originalTotal' | 'shippingCost'> & {
  total: number;
  createdAt: string;
  updatedAt: string;
  exchangeRate?: number | null;
  originalTotal?: number | null;
  shippingCost?: number | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items: Array<Omit<OrderWithRelations['items'][0], 'unitPrice' | 'totalPrice' | 'metadata' | 'discountValue' | 'discountAmount'> & {
    unitPrice: number;
    totalPrice: number;
    metadata: string | null;
    discountValue: number | null;
    discountAmount: number | null;
  }>;
  payments: Array<Omit<OrderWithRelations['payments'][0], 'amount' | 'createdAt' | 'feeAmount' | 'netAmount' | 'originalAmount'> & {
    amount: number;
    createdAt: string;
    status: string;
    feeAmount?: number | null;
    netAmount?: number | null;
    originalAmount?: number | null;
  }>;
};

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
    items: {
      include: {
        offer: {
          select: {
            id: true;
            name: true;
          };
        };
        product: {
          select: {
            id: true;
            name: true;
          };
        };
        service: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    payments: {
      select: {
        id: true;
        amount: true;
        currency: true;
        method: true;
        provider: true;
        createdAt: true;
      };
    };
  };
}>;

// Fonction pour obtenir les statistiques des commandes
async function getOrdersStats() {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Requêtes de base pour les comptages
    const [
      totalOrders,
      pendingOrders,
      partiallyPaidOrders,
      paidOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      todayOrders,
      thisWeekOrders,
      thisMonthOrders,
      lastMonthOrders
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PARTIALLY_PAID' } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'REFUNDED' } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.order.count({ 
        where: { 
          createdAt: { 
            gte: lastMonth,
            lt: thisMonth
          } 
        } 
      })
    ]);

    // Calcul précis du chiffre d'affaires basé sur les paiements reçus
    const allPayments = await prisma.payment.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'PAID', 'completed']
        }
      },
      select: {
        amount: true,
        currency: true,
        paymentExchangeRate: true,
        originalAmount: true,
        status: true,
        createdAt: true
      }
    });

    // Calcul du CA total en Ariary basé uniquement sur les paiements
    let totalRevenue = 0;
    let totalRevenueUSD = 0;
    let totalRevenueEUR = 0;
    let totalPaidAmount = 0;

    allPayments.forEach(payment => {
      const paymentAmount = Number(payment.amount);
      const paymentCurrency = payment.currency || 'Ar';
      const paymentRate = payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : 1;
      const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : paymentAmount;

      // Ajouter au total des paiements (en Ariary)
      if (paymentCurrency === 'Ar' || paymentCurrency === 'MGA') {
        // MGA et Ar sont équivalents (Ariary = Malagasy Ariary)
        totalRevenue += paymentAmount;
        totalPaidAmount += paymentAmount;
      } else {
        // Utiliser le taux de change spécifique à ce paiement
        const revenueInAr = originalAmount * paymentRate;
        totalRevenue += revenueInAr;
        totalPaidAmount += revenueInAr;
        
        // Comptabiliser aussi par devise d'origine
        if (paymentCurrency === 'USD') {
          totalRevenueUSD += originalAmount;
        } else if (paymentCurrency === 'EUR') {
          totalRevenueEUR += originalAmount;
        }
      }
    });

    // Calcul du CA du mois en cours basé sur les paiements
    const thisMonthPayments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: thisMonth },
        status: {
          in: ['COMPLETED', 'PAID', 'completed']
        }
      },
      select: {
        amount: true,
        currency: true,
        paymentExchangeRate: true,
        originalAmount: true
      }
    });

    const thisMonthRevenueTotal = thisMonthPayments.reduce((sum, payment) => {
      const paymentAmount = Number(payment.amount);
      const paymentCurrency = payment.currency || 'Ar';
      const paymentRate = payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : 1;
      const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : paymentAmount;

      if (paymentCurrency === 'Ar' || paymentCurrency === 'MGA') {
        return sum + paymentAmount;
      } else {
        // Utiliser le taux de change spécifique à ce paiement
        return sum + (originalAmount * paymentRate);
      }
    }, 0);

    // Calcul du panier moyen basé sur les paiements
    const totalPaymentsCount = allPayments.length;
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    
    // Calcul du panier moyen par commande payée
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    // Taux de conversion
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    return {
      // Comptages de base
      totalOrders,
      pendingOrders,
      partiallyPaidOrders,
      paidOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      
      // Comptages temporels
      todayOrders,
      thisWeekOrders,
      thisMonthOrders,
      lastMonthOrders,
      
      // Chiffres d'affaires précis
      totalRevenue: Math.round(totalRevenue),
      totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
      totalRevenueEUR: Math.round(totalRevenueEUR * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenueTotal),
      totalPaidAmount: Math.round(totalPaidAmount),
      
      // Métriques calculées
      averageOrderValue: Math.round(averageOrderValue),
      averagePaymentValue: Math.round(averagePaymentValue),
      totalPaymentsCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      
      // Croissance mensuelle
      monthlyGrowth: lastMonthOrders > 0 ? 
        Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 * 100) / 100 : 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      partiallyPaidOrders: 0,
      paidOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      refundedOrders: 0,
      todayOrders: 0,
      thisWeekOrders: 0,
      thisMonthOrders: 0,
      lastMonthOrders: 0,
      totalRevenue: 0,
      totalRevenueUSD: 0,
      totalRevenueEUR: 0,
      thisMonthRevenue: 0,
      totalPaidAmount: 0,
      averageOrderValue: 0,
      averagePaymentValue: 0,
      totalPaymentsCount: 0,
      conversionRate: 0,
      monthlyGrowth: 0
    };
  }
}

// Fonction pour obtenir les commandes avec pagination
async function getOrders(page: number = 1, limit: number = 20): Promise<{
  orders: OrderWithConvertedPrices[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    console.log('🔍 getOrders appelé:', { page, limit });
    const skip = (page - 1) * limit;
    
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              offer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        payments: {
          select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              provider: true,
              createdAt: true,
              status: true
            }
          },
          billingAddress: true,
          shippingAddress: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count()
    ]);

    console.log('📊 Résultats requête:', { 
      ordersCount: orders.length, 
      totalCount,
      premièresCommandes: orders.slice(0, 3).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status
      }))
    });

    // Convertir les Decimal en nombres et les dates en strings pour éviter les erreurs d'hydratation
    const convertedOrders = orders.map(order => {
      // Fonction helper pour convertir les Decimal
      const convertDecimal = (value: any) => {
        if (value === null || value === undefined) return null;
        return typeof value === 'object' && value.constructor.name === 'Decimal' ? Number(value) : Number(value);
      };

      return {
        ...order,
        // Convertir tous les champs Decimal potentiels
        total: convertDecimal(order.total),
        exchangeRate: convertDecimal((order as any).exchangeRate),
        originalTotal: convertDecimal((order as any).originalTotal),
        shippingCost: convertDecimal((order as any).shippingCost),
        deliveryCost: convertDecimal((order as any).deliveryCost),
        globalDiscountValue: convertDecimal((order as any).globalDiscountValue),
        globalDiscountAmount: convertDecimal((order as any).globalDiscountAmount),
        
        // Convertir les dates
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        
        // User data
        user: {
          ...order.user,
          email: order.user.email || ""
        },
        
        // Items avec conversion Decimal
        items: order.items.map(item => ({
          ...item,
          unitPrice: convertDecimal(item.unitPrice),
          totalPrice: convertDecimal(item.totalPrice),
          discountValue: convertDecimal(item.discountValue),
          discountAmount: convertDecimal(item.discountAmount),
          metadata: item.metadata ? (typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata)) : null
        })),
        
        // Payments avec conversion Decimal
        payments: order.payments.map(payment => ({
          ...payment,
          amount: convertDecimal(payment.amount),
          feeAmount: convertDecimal((payment as any).feeAmount),
          netAmount: convertDecimal((payment as any).netAmount),
          originalAmount: convertDecimal((payment as any).originalAmount),
          paymentExchangeRate: convertDecimal((payment as any).paymentExchangeRate),
          createdAt: payment.createdAt.toISOString()
        })),

        // Addresses (si elles existent)
        billingAddress: order.billingAddress ? {
          ...order.billingAddress
        } : null,
        
        shippingAddress: order.shippingAddress ? {
          ...order.shippingAddress,
          // Convertir les dates si présentes
          ...(order.shippingAddress.createdAt && { createdAt: order.shippingAddress.createdAt.toISOString() }),
          ...(order.shippingAddress.updatedAt && { updatedAt: order.shippingAddress.updatedAt.toISOString() })
        } : null
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    console.log('✅ getOrders terminé:', { 
      convertedOrdersCount: convertedOrders.length,
      totalPages,
      currentPage: page
    });

    return {
      orders: convertedOrders,
      totalCount,
      totalPages,
      currentPage: page
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return {
      orders: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  
  const [ordersData, stats] = await Promise.all([
    getOrders(page, limit),
    getOrdersStats()
  ]);

  return (
    <div className="p-4">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* Liste des commandes avec en-tête intégré */}
        <Suspense fallback={<OrdersLoading />}>
          <EnhancedOrdersList 
            orders={ordersData.orders} 
            stats={stats}
            pagination={{
              currentPage: ordersData.currentPage,
              totalPages: ordersData.totalPages,
              totalCount: ordersData.totalCount,
              limit: limit
            }}
          />
        </Suspense>
      </div>
    </div>
  );
} 