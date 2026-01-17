import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, CreditCard, Clock, Package, Users, Monitor, AlertCircle, ShoppingCart, CheckCircle, XCircle, Calendar, ExternalLink, Receipt, Truck } from 'lucide-react';

// Désactiver le cache pour cette page dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import OrderStatusBadge from '@/components/admin/orders/order-status-badge';
import { OrderActions } from '@/components/admin/orders/order-actions';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { PaymentSummaryWrapper } from '@/components/admin/orders/payment-summary-wrapper';
import { ReturnItemButton } from '@/components/admin/orders/return-item-button';
import { OrderDetailWrapper } from '@/components/admin/orders/order-detail-wrapper';
import { PaymentAmountDisplay } from '@/components/admin/orders/payment-amount-display';
import { prisma } from "@/lib/prisma";

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  phoneNumber?: string | null;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

interface ReturnItem {
  id: string;
  quantity: number;
  reason: string | null;
  condition: string | null;
  refundAmount: number;
  orderItem: {
    product?: { name: string };
    service?: { name: string };
    offer?: { name: string };
    metadata: any;
  };
}

interface OrderReturn {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  description: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  refundedAmount: number | null;
  createdAt: Date;
  returnItems: ReturnItem[];
}

interface PlatformOffer {
  id: string;
  platform: {
    id: string;
    name: string;
    logo?: string | null;
  };
}

interface Account {
  id: string;
  username: string;
  email: string;
  platform: {
    id: string;
    name: string;
    logo: string | null;
  };
}

interface AccountProfile {
  id: string;
  name: string;
  profileSlot: number;
  pin: string | null;
  isAssigned: boolean;
  accountId: string;
  account: {
    username: string;
    email: string;
    id: string;
  };
}

interface SubscriptionAccount {
  account: Account;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  platformOfferId: string;
  offer: {
    name: string;
  };
  platformOffer: PlatformOffer | null;
  subscriptionAccounts: SubscriptionAccount[];
  accountProfiles: AccountProfile[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  metadata: any; // JsonValue from Prisma
  productId?: string;
  serviceId?: string;
  offerId?: string;
  product?: { id: string; name: string };
  service?: { id: string; name: string };
  offer?: { id: string; name: string };
  // Nouveaux champs de réduction
  discountType?: string | null;
  discountValue?: number | null;
  discountAmount?: number | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string | null;
  transactionId: string | null;
  reference: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  processedByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface OrderHistoryEntry {
  id: string;
  status: string;
  previousStatus?: string;
  action: string;
  description?: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  status: string;
  paymentStatus: string;
  currency: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  items: OrderItem[];
  payments: Payment[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
  subscriptions: Subscription[];
  returns: OrderReturn[];
  history: OrderHistoryEntry[];
  // Nouveaux champs de réduction globale
  globalDiscountType?: string | null;
  globalDiscountValue?: number | null;
  globalDiscountAmount?: number | null;
  notes?: string | null;
  // Champs de livraison
  deliveryMode?: string | null;
  deliveryName?: string | null;
  deliveryCost?: number | null;
  deliveryTime?: string | null;
  deliveryDetails?: string | null;
}

// Fonction pour extraire les informations des métadonnées
function parseMetadata(metadata: any) {
  if (!metadata) return null;
  try {
    if (typeof metadata === 'string') {
      return JSON.parse(metadata);
    }
    return metadata;
  } catch {
    return null;
  }
}

// Fonction pour formater le mode de paiement
function formatPaymentMethod(method: string): string {
  const methods: { [key: string]: string } = {
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Virement bancaire',
    'cash_on_delivery': 'Paiement à la livraison',
    'cash': 'Espèce',
    'credit_card': 'Carte bancaire',
    'card': 'Carte bancaire',
    'paypal': 'PayPal'
  };
  return methods[method] || method;
}

// Fonction pour obtenir tous les modes de paiement utilisés
function getAllPaymentMethods(payments: Payment[]): string {
  if (!payments || payments.length === 0) return 'Non spécifié';
  
  const uniqueMethods = Array.from(new Set(payments.map(payment => payment.method)));
  const methodLabels = uniqueMethods.map(method => formatPaymentMethod(method));
  
  if (methodLabels.length === 1) {
    return methodLabels[0];
  }
  
  return methodLabels.join(' + ');
}

// Fonction pour calculer le statut de paiement
function getPaymentStatus(order: Order): { status: string; statusElement: JSX.Element; totalPaid: number; remaining: number } {
  const totalPaid = order.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOrder = order.total;
  const remaining = Math.max(0, totalOrder - totalPaid);
  
  // Helper pour formater les prix avec conversion
  const formatPrice = (price: number) => {
    // Utiliser PriceWithConversion mais récupérer seulement le texte
    return <PriceWithConversion price={price} />;
  };

  let status = '';
  let statusElement = null;
  if (totalPaid === 0) {
    statusElement = (
      <span>💳 <PriceWithConversion price={totalOrder} /> à payer</span>
    );
  } else if (remaining > 0) {
    statusElement = (
      <span>⚠️ <PriceWithConversion price={totalPaid} /> payé, <PriceWithConversion price={remaining} /> restant</span>
    );
  } else {
    statusElement = <span>✅ Entièrement payé</span>;
  }
  
  return { status, statusElement, totalPaid, remaining };
}

// Fonction pour calculer les totaux avec réductions
function calculateOrderTotals(order: Order) {
  // Sous-total des articles (après réductions individuelles)
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Réduction globale
  const globalDiscountAmount = order.globalDiscountAmount || 0;
  
  // Total final
  const finalTotal = order.total;
  
  return {
    itemsSubtotal,
    globalDiscountAmount,
    finalTotal,
    hasDiscounts: globalDiscountAmount > 0 || order.items.some(item => (item.discountAmount || 0) > 0)
  };
}

// Fonction pour formater l'affichage des réductions
function formatDiscount(discountType: string | null, discountValue: number | null, discountAmount: number | null, currency: string) {
  if (!discountType || !discountValue || !discountAmount) return null;
  
  const valueText = discountType === 'PERCENTAGE' ? `${discountValue}%` : `${discountValue.toLocaleString('fr-FR')} ${currency}`;
  const amountText = `${discountAmount.toLocaleString('fr-FR')} ${currency}`;
  
  return {
    valueText,
    amountText,
    type: discountType
  };
}

async function getOrder(id: string): Promise<any> {
  const order = await prisma.order.findUnique({
    where: { id },
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
          originalAmount: true,
          paymentExchangeRate: true,
          paymentDisplayCurrency: true,
          paymentBaseCurrency: true,
          method: true,
          provider: true,
          transactionId: true,
          reference: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
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
      shippingAddress: true,
      billingAddress: true,
      subscriptions: {
        include: {
          offer: {
            select: {
              id: true,
              name: true,
            },
          },
          platformOffer: {
            include: {
              platform: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                },
              },
            },
          },
          subscriptionAccounts: {
            include: {
              account: {
                include: {
                  platform: {
                    select: {
                      id: true,
                      name: true,
                      logo: true,
                    },
                  },
                },
              },
            },
          },
          accountProfiles: {
            include: {
              account: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Convertir les Decimal en nombres et formater les dates
  return {
    ...order,
    total: Number(order.total),
    deliveryCost: (order as any).deliveryCost ? Number((order as any).deliveryCost) : null,
    exchangeRate: (order as any).exchangeRate ? Number((order as any).exchangeRate) : null,
    originalTotal: (order as any).originalTotal ? Number((order as any).originalTotal) : null,
    shippingCost: (order as any).shippingCost ? Number((order as any).shippingCost) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    globalDiscountValue: (order as any).globalDiscountValue ? Number((order as any).globalDiscountValue) : null,
    globalDiscountAmount: (order as any).globalDiscountAmount ? Number((order as any).globalDiscountAmount) : null,
    items: (order as any).items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discountValue: item.discountValue ? Number(item.discountValue) : null,
      discountAmount: item.discountAmount ? Number(item.discountAmount) : null,
      metadata: item.metadata, // Préserver les métadonnées
    })),
    payments: (order as any).payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount),
      feeAmount: payment.feeAmount ? Number(payment.feeAmount) : null,
      netAmount: payment.netAmount ? Number(payment.netAmount) : null,
      paymentExchangeRate: payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : null,
      originalAmount: payment.originalAmount ? Number(payment.originalAmount) : null,
      createdAt: payment.createdAt.toISOString(),
    })),
    returns: [], // Sera rempli séparément
    history: [], // Pas d'historique implémenté
    subscriptions: (order as any).subscriptions.map((sub: any) => ({
      ...sub,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
    })),
  };
}

async function getOrderReturns(orderId: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/debug/returns?orderNumber=${orderId}`, {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.found && data.order.returnsCount > 0) {
      return data.order.returns.map((ret: any) => ({
        ...ret,
        createdAt: ret.createdAt // Déjà en string depuis l'API
      }));
    }
    return [];
  } catch (error) {
    console.error('Erreur récupération retours:', error);
    return [];
  }
}

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  
  // Récupérer les retours séparément via l'API debug
  const returns = order.orderNumber ? await getOrderReturns(order.orderNumber) : [];
  
  // Ajouter les retours à l'ordre
  order.returns = returns;
  
  // Calculer les totaux avec réductions
  const orderTotals = calculateOrderTotals(order);
  
  // Extraire les métadonnées du premier item pour les informations générales
  const firstItemMetadata = order.items.length > 0 ? parseMetadata(order.items[0].metadata) : null;
  const paymentMethod = firstItemMetadata?.paymentMethod;
  const billingAddress = firstItemMetadata?.billingAddress;
  const shippingAddress = firstItemMetadata?.shippingAddress;
  const notes = firstItemMetadata?.notes;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        {/* En-tête moderne et compact */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/orders">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Commandes
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {order.orderNumber || `#${order.id.substring(0, 8)}`}
                </h1>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <OrderActions 
                orderId={order.id} 
                orderStatus={order.status} 
                orderNumber={order.orderNumber}
                paymentStatus={order.status}
                hasPayments={order.payments && order.payments.length > 0}
              />
            </div>
          </div>
        </div>

        {/* Barre de progression du statut - Largeur complète */}
        <OrderDetailWrapper
          orderId={order.id}
          initialStatus={order.status}
          orderNumber={order.orderNumber}
          orderTotal={Number(order.total)}
          currency={order.currency}
        />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Colonne principale - Articles et détails */}
          <div className="xl:col-span-3 space-y-4">

          {/* Articles de la commande */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                Articles commandés ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {order.items.map((item, index) => {
                  const itemMetadata = parseMetadata(item.metadata);
                  
                  // Debug: log pour voir les métadonnées
                  if (!item.product && !item.service && !item.offer) {
                    console.log('Item sans relation:', {
                      itemId: item.id,
                      itemType: item.itemType,
                      metadata: item.metadata,
                      parsedMetadata: itemMetadata
                    });
                  }
                  
                  return (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {item.itemType === 'PRODUCT' && <Package className="h-5 w-5 text-blue-600" />}
                              {item.itemType === 'SERVICE' && <Users className="h-5 w-5 text-blue-600" />}
                              {item.itemType === 'OFFER' && <Monitor className="h-5 w-5 text-blue-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {(() => {
                                  // Priorité aux relations directes
                                  if (item.product?.name) return item.product.name;
                                  if (item.service?.name) return item.service.name;
                                  if (item.offer?.name) return item.offer.name;
                                  
                                  // Vérifier les métadonnées pour les produits importés
                                  if (itemMetadata) {
                                    // Essayer différentes propriétés possibles dans les métadonnées
                                    if (itemMetadata.name) return itemMetadata.name;
                                    if (itemMetadata.productName) return itemMetadata.productName;
                                    if (itemMetadata.serviceName) return itemMetadata.serviceName;
                                    if (itemMetadata.offerName) return itemMetadata.offerName;
                                    if (itemMetadata.title) return itemMetadata.title;
                                  }
                                  
                                  // Fallback supplémentaire si parseMetadata a échoué
                                  if (item.metadata) {
                                    try {
                                      const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                                      if (metadata?.name) return metadata.name;
                                      if (metadata?.productName) return metadata.productName;
                                      if (metadata?.serviceName) return metadata.serviceName;
                                      if (metadata?.offerName) return metadata.offerName;
                                      if (metadata?.title) return metadata.title;
                                    } catch (e) {
                                      console.error('Erreur parsing metadata:', e);
                                    }
                                  }
                                  
                                  return 'Article';
                                })()}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.itemType === 'PRODUCT' && 'Produit'}
                                  {item.itemType === 'SERVICE' && 'Service'}
                                  {item.itemType === 'OFFER' && 'Abonnement'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right ml-4">
                          {item.discountAmount && item.discountAmount > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-sm text-gray-400 line-through">
                                  <PriceWithConversion price={item.unitPrice * item.quantity} />
                                </span>
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  -{item.discountType === 'PERCENTAGE' 
                                    ? `${item.discountValue}%` 
                                    : `${item.discountValue?.toLocaleString('fr-FR')} Ar`
                                  }
                                </Badge>
                              </div>
                              <p className="font-semibold text-green-600">
                                <PriceWithConversion price={item.totalPrice} />
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-gray-900">
                                <PriceWithConversion price={item.totalPrice} />
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} × <PriceWithConversion price={item.unitPrice} />
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Détails spécifiques aux abonnements */}
                      {item.itemType === 'OFFER' && order.subscriptions.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                           {order.subscriptions
                             .filter(sub => sub.offer.name === item.offer?.name)
                             .map((subscription, subIndex) => (
                               <div key={subscription.id} className="space-y-3">
                                 {/* Informations de base de l'abonnement */}
                                 <div className="flex flex-wrap items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                                   <div className="flex items-center gap-2">
                                     {(subscription.subscriptionAccounts?.[0]?.account?.platform?.logo || 
                                       subscription.platformOffer?.platform?.logo) && (
                                       <img 
                                         src={subscription.subscriptionAccounts?.[0]?.account?.platform?.logo || 
                                              subscription.platformOffer?.platform?.logo} 
                                         alt={subscription.subscriptionAccounts?.[0]?.account?.platform?.name || 
                                              subscription.platformOffer?.platform?.name}
                                         className="w-5 h-5 rounded"
                                       />
                                     )}
                                     <Monitor className="h-4 w-4" />
                                     <span className="font-medium text-gray-700">
                                       {subscription.subscriptionAccounts?.[0]?.account?.platform?.name || 
                                        subscription.platformOffer?.platform?.name || 
                                        'Plateforme non spécifiée'}
                                     </span>
                                   </div>
                                   <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                     {subscription.status}
                                   </Badge>
                                   <span className="text-muted-foreground">
                                     {new Date(subscription.startDate).toLocaleDateString('fr-FR')} 
                                     → {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                                   </span>
                                 </div>

                                 {/* Comptes assignés */}
                                 {subscription.subscriptionAccounts && subscription.subscriptionAccounts.length > 0 && (
                                   <div className="bg-blue-50 rounded-lg p-3">
                                     <div className="flex items-center gap-2 mb-2">
                                       <User className="h-4 w-4 text-blue-600" />
                                       <span className="font-medium text-blue-800">Compte assigné</span>
                                     </div>
                                     {subscription.subscriptionAccounts.map((subAccount, accountIndex) => (
                                       <div key={accountIndex} className="text-sm space-y-1">
                                         <div className="flex items-center gap-2">
                                           <span className="font-medium">{subAccount.account.username}</span>
                                           <span className="text-muted-foreground">({subAccount.account.email})</span>
                                         </div>
                                         <div className="text-xs text-muted-foreground">
                                           Plateforme: {subAccount.account.platform.name}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 )}

                                 {/* Profils assignés */}
                                 {subscription.accountProfiles && subscription.accountProfiles.length > 0 && (
                                   <div className="bg-green-50 rounded-lg p-3">
                                     <div className="flex items-center gap-2 mb-2">
                                       <Users className="h-4 w-4 text-green-600" />
                                       <span className="font-medium text-green-800">
                                         Profils assignés ({subscription.accountProfiles.length})
                                       </span>
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                       {subscription.accountProfiles.map((profile, profileIndex) => (
                                         <div key={profile.id} className="text-sm bg-white rounded p-2 border">
                                           <div className="flex items-center justify-between">
                                             <span className="font-medium">{profile.name}</span>
                                             <Badge variant="outline" className="text-xs">
                                               Slot {profile.profileSlot}
                                             </Badge>
                                           </div>
                                           <div className="text-xs text-muted-foreground mt-1">
                                             Compte: {profile.account.username}
                                             {profile.pin && (
                                               <span className="ml-2">• PIN: {profile.pin}</span>
                                             )}
                                           </div>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 {/* Message si pas de compte/profil assigné */}
                                 {(!subscription.subscriptionAccounts || subscription.subscriptionAccounts.length === 0) && 
                                  (!subscription.accountProfiles || subscription.accountProfiles.length === 0) && (
                                   <div className="bg-yellow-50 rounded-lg p-3">
                                     <div className="flex items-center gap-2 text-yellow-700">
                                       <AlertCircle className="h-4 w-4" />
                                       <span className="text-sm font-medium">
                                         Aucun compte ou profil assigné à cet abonnement
                                       </span>
                                     </div>
                                     <p className="text-xs text-yellow-600 mt-1">
                                       L'abonnement doit être configuré avec un compte et des profils.
                                     </p>
                                   </div>
                                 )}
                               </div>
                             ))
                           }
                        </div>
                      )}

                      {/* Métadonnées spécifiques à l'article */}
                      {itemMetadata && itemMetadata.notes && (
                        <div className="border-t pt-4 mt-4">
                          <p className="text-sm font-medium text-muted-foreground">Notes spécifiques</p>
                          <p className="text-sm mt-1">{itemMetadata.notes}</p>
                        </div>
                      )}

                      {/* Bouton de retour */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-muted-foreground">Actions</p>
                          <ReturnItemButton
                            orderItem={item}
                            orderId={order.id}
                            orderNumber={order.orderNumber || ''}
                            currency={order.currency}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Historique des paiements */}
          {order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Historique des paiements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.payments.map((payment, index) => (
                    <div key={payment.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        payment.status === 'COMPLETED' ? 'bg-green-500' : 
                        payment.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">
                            <PaymentAmountDisplay 
                              amount={payment.amount}
                              currency={payment.currency}
                              originalAmount={payment.originalAmount}
                              paymentExchangeRate={payment.paymentExchangeRate}
                              paymentDisplayCurrency={payment.paymentDisplayCurrency}
                            />
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-blue-600">
                            {formatPaymentMethod(payment.method)}
                          </span>
                          {payment.provider && (
                            <span className="text-xs text-muted-foreground">
                              • {payment.provider}
                            </span>
                          )}
                        </div>
                        {payment.transactionId && (
                          <p className="text-xs text-muted-foreground">
                            Transaction: {payment.transactionId}
                          </p>
                        )}
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground">
                            Référence: {payment.reference}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {payment.notes}
                          </p>
                        )}
                        {payment.processedByUser && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Traité par: {payment.processedByUser.firstName} {payment.processedByUser.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Retours */}
          {order.returns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Retours de produits ({order.returns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.returns.map((returnItem) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'REQUESTED': return 'bg-yellow-100 text-yellow-800'
                        case 'APPROVED': return 'bg-blue-100 text-blue-800'
                        case 'REJECTED': return 'bg-red-100 text-red-800'
                        case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800'
                        case 'RECEIVED': return 'bg-indigo-100 text-indigo-800'
                        case 'PROCESSED': return 'bg-orange-100 text-orange-800'
                        case 'REFUNDED': return 'bg-green-100 text-green-800'
                        default: return 'bg-gray-100 text-gray-800'
                      }
                    }

                    const getStatusLabel = (status: string) => {
                      switch (status) {
                        case 'REQUESTED': return 'Demandé'
                        case 'APPROVED': return 'Approuvé'
                        case 'REJECTED': return 'Rejeté'
                        case 'IN_TRANSIT': return 'En transit'
                        case 'RECEIVED': return 'Reçu'
                        case 'PROCESSED': return 'Traité'
                        case 'REFUNDED': return 'Remboursé'
                        default: return status
                      }
                    }

                    const getItemName = (orderItem: any) => {
                      // Vérifier si orderItem existe
                      if (!orderItem) {
                        return 'Article non trouvé'
                      }
                      
                      // Priorité aux relations directes
                      if (orderItem?.product?.name) return orderItem.product.name
                      if (orderItem?.service?.name) return orderItem.service.name
                      if (orderItem?.offer?.name) return orderItem.offer.name
                      
                      // Fallback sur metadata
                      if (orderItem?.metadata) {
                        try {
                          let metadata = orderItem.metadata
                          
                          // Si c'est une chaîne, essayer de la parser
                          if (typeof metadata === 'string') {
                            metadata = JSON.parse(metadata)
                          }
                          
                          // Vérifier différentes propriétés possibles
                          if (metadata?.name) return metadata.name
                          if (metadata?.productName) return metadata.productName
                          if (metadata?.serviceName) return metadata.serviceName
                          if (metadata?.offerName) return metadata.offerName
                          if (metadata?.title) return metadata.title
                          
                        } catch (error) {
                          // Si le parsing JSON échoue, essayer d'utiliser la chaîne directement
                          if (typeof orderItem.metadata === 'string' && orderItem.metadata.length > 0) {
                            return orderItem.metadata
                          }
                        }
                      }
                      
                      // Dernière tentative avec les propriétés de base
                      if (orderItem?.name) return orderItem.name
                      if (orderItem?.title) return orderItem.title
                      
                      return 'Article inconnu'
                    }

                    return (
                      <div key={returnItem.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold">Retour #{returnItem.returnNumber}</h4>
                              <Badge className={getStatusColor(returnItem.status)}>
                                {getStatusLabel(returnItem.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Créé le {new Date(returnItem.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold"><PriceWithConversion price={returnItem.requestedAmount} /></p>
                            <p className="text-sm text-gray-600">Montant demandé</p>
                            {returnItem.refundedAmount && (
                              <p className="text-sm text-green-600 font-medium">
                                Remboursé: <PriceWithConversion price={returnItem.refundedAmount} />
                              </p>
                            )}
                          </div>
                        </div>

                        {returnItem.description && (
                          <p className="text-sm text-gray-700 mb-3 p-2 bg-gray-50 rounded">
                            {returnItem.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">Articles retournés:</p>
                          {returnItem.returnItems && returnItem.returnItems.length > 0 ? (
                            returnItem.returnItems.map((item) => {
                              const itemName = getItemName(item.orderItem)
                              
                              // Debug temporaire - à supprimer après test
                              if (typeof window !== 'undefined') {
                                console.log('🔍 ReturnItem:', item.id)
                                console.log('🔍 OrderItem:', item.orderItem)
                                console.log('🔍 Metadata:', item.orderItem?.metadata)
                                console.log('🎯 Nom calculé:', itemName)
                              }
                              
                              return (
                                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                  <span>{itemName} (x{item.quantity})</span>
                                  <span className="font-medium"><PriceWithConversion price={item.refundAmount} /></span>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-sm text-gray-500 italic">Aucun article spécifié</p>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Raison: {returnItem.reason === 'DEFECTIVE' ? 'Défectueux' : 
                                    returnItem.reason === 'WRONG_ITEM' ? 'Article incorrect' : 
                                    returnItem.reason === 'NOT_AS_DESCRIBED' ? 'Non conforme' : 
                                    returnItem.reason === 'CHANGED_MIND' ? 'Changement d\'avis' : 
                                    returnItem.reason}
                          </span>
                          <Link href={`/admin/returns/${returnItem.id}`}>
                            <Button variant="outline" size="sm">
                              Voir détails
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique des statuts */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-purple-600" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {/* Entrée de création de commande */}
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Commande créée</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Historique dynamique des changements de statut */}
                {order.history && order.history.length > 0 && order.history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      entry.action === 'STATUS_CHANGE' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {entry.description || `Statut: ${entry.status}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {entry.user && (
                          <span className="ml-1">
                            • {entry.user.firstName} {entry.user.lastName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Statut actuel si pas d'historique */}
                {(!order.history || order.history.length === 0) && (
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Statut actuel: {order.status}</p>
                      <p className="text-sm text-muted-foreground">
                        Dernière mise à jour: {new Date(order.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Abonnements associés */}
          {order.subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Abonnements associés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
                      {/* En-tête de l'abonnement */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(subscription.subscriptionAccounts?.[0]?.account?.platform?.logo || 
                            subscription.platformOffer?.platform?.logo) && (
                            <img 
                              src={subscription.subscriptionAccounts?.[0]?.account?.platform?.logo || 
                                   subscription.platformOffer?.platform?.logo} 
                              alt={subscription.subscriptionAccounts?.[0]?.account?.platform?.name || 
                                   subscription.platformOffer?.platform?.name}
                              className="w-8 h-8 rounded"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold">{subscription.offer.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {subscription.subscriptionAccounts?.[0]?.account?.platform?.name || 
                               subscription.platformOffer?.platform?.name || 
                               'Plateforme non spécifiée'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {subscription.status === 'ACTIVE' ? 'Actif' :
                             subscription.status === 'PENDING' ? 'En attente' :
                             subscription.status === 'EXPIRED' ? 'Expiré' :
                             subscription.status}
                          </Badge>
                          <Link href={`/admin/streaming/subscriptions/${subscription.id}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Informations de l'abonnement */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Début :</span>
                          <p>{new Date(subscription.startDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Fin :</span>
                          <p>{new Date(subscription.endDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Renouvellement :</span>
                          <p>{subscription.autoRenew ? 'Automatique' : 'Manuel'}</p>
                        </div>
                      </div>

                      {/* Comptes et profils assignés */}
                      {subscription.subscriptionAccounts && subscription.subscriptionAccounts.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Compte assigné</span>
                          </div>
                          {subscription.subscriptionAccounts.map((subAccount, accountIndex) => (
                            <div key={accountIndex} className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{subAccount.account.username}</span>
                                <span className="text-muted-foreground">({subAccount.account.email})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {subscription.accountProfiles && subscription.accountProfiles.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">
                              Profils assignés ({subscription.accountProfiles.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subscription.accountProfiles.map((profile) => (
                              <div key={profile.id} className="text-sm bg-white rounded p-2 border">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{profile.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    Slot {profile.profileSlot}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

          {/* Colonne latérale - Résumé et informations */}
          <div className="xl:col-span-1 space-y-6">
          
          {/* Résumé de la commande */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-green-600" />
                Résumé
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total articles</span>
                <PriceWithConversion price={orderTotals.itemsSubtotal} />
              </div>
              
              {/* Réduction globale */}
              {orderTotals.globalDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-2">
                    <span>Réduction globale</span>
                    {order.globalDiscountType && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        {order.globalDiscountType === 'PERCENTAGE' 
                          ? `${order.globalDiscountValue}%` 
                          : `${order.globalDiscountValue?.toLocaleString('fr-FR')} Ar`
                        }
                      </Badge>
                    )}
                  </span>
                  <span>-<PriceWithConversion price={orderTotals.globalDiscountAmount} /></span>
                </div>
              )}
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {order.deliveryName || 'Frais de livraison'}
                    {order.deliveryTime && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({order.deliveryTime})
                      </span>
                    )}
                  </span>
                </div>
                <span>
                  {order.deliveryCost ? (
                    <PriceWithConversion price={order.deliveryCost} />
                  ) : (
                    'Gratuit'
                  )}
                </span>
              </div>
              
              {/* Total des économies */}
              {orderTotals.hasDiscounts && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-green-700">
                    <span className="font-medium">💰 Total économisé</span>
                    <span className="font-semibold">
                      <PriceWithConversion price={orderTotals.itemsSubtotal + orderTotals.globalDiscountAmount - orderTotals.finalTotal} />
                    </span>
                  </div>
                </div>
              )}
              
              <Separator />
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <PriceWithConversion price={order.total} />
              </div>
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className="text-muted-foreground">{order.user.email}</p>
                {order.user.phone && (
                  <p className="text-muted-foreground">{order.user.phone}</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Voir le profil client
              </Button>
            </CardContent>
          </Card>

          {/* Informations de livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.deliveryName ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Mode de livraison</p>
                    <p className="font-medium">{order.deliveryName}</p>
                  </div>
                  
                  {order.deliveryTime && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Délai estimé</p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {order.deliveryTime}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Coût de livraison</p>
                    <p className="font-medium">
                      {order.deliveryCost ? (
                        <PriceWithConversion price={order.deliveryCost} />
                      ) : (
                        <span className="text-green-600">Gratuit</span>
                      )}
                    </p>
                  </div>
                  
                  {order.deliveryDetails && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Détails</p>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          try {
                            const details = JSON.parse(order.deliveryDetails);
                            return (
                              <div className="space-y-1">
                                {details.description && <p>{details.description}</p>}
                                {details.code && (
                                  <p className="text-xs">
                                    <span className="font-mono bg-gray-100 px-1 rounded">
                                      {details.code}
                                    </span>
                                  </p>
                                )}
                              </div>
                            );
                          } catch {
                            return <p>{order.deliveryDetails}</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">
                  <p>Aucune information de livraison</p>
                  <p className="text-xs">Commande créée avant l'ajout des modes de livraison</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations de paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Modes de paiement utilisés */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Modes de paiement</p>
                  <p className="font-medium">
                    {getAllPaymentMethods(order.payments)}
                  </p>
                </div>

                {/* Statut de paiement */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Statut</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      order.paymentStatus === 'PAID' ? 'bg-green-500' : 
                      order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm">
                      {getPaymentStatus(order).statusElement}
                    </span>
                  </div>
                </div>

                {/* Résumé financier */}
                {order.payments.length > 0 && (
                  <PaymentSummaryWrapper 
                    payments={order.payments}
                    orderTotal={order.total}
                    orderCurrency={order.currency}
                    orderExchangeRates={order.exchangeRates}
                    orderDisplayCurrency={order.displayCurrency}
                    orderExchangeRate={order.exchangeRate}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adresse de facturation */}
              {order.billingAddress ? (
                <div>
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Adresse de facturation
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1 bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium">{order.user.firstName} {order.user.lastName}</p>
                    <p>{order.billingAddress.street}</p>
                    <p>{order.billingAddress.city} {order.billingAddress.zipCode}</p>
                    <p>{order.billingAddress.country}</p>
                    {order.billingAddress.phoneNumber && (
                      <p>📞 {order.billingAddress.phoneNumber}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Adresse de facturation
                  </p>
                  <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{order.user.firstName} {order.user.lastName}</p>
                    <p>{order.user.email}</p>
                    {order.user.phone && <p>📞 {order.user.phone}</p>}
                    <p className="text-xs italic">Adresse non spécifiée</p>
                  </div>
                </div>
              )}
              
              {/* Adresse de livraison */}
              {order.shippingAddress ? (
                <div>
                  <Separator className="my-3" />
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Adresse de livraison
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1 bg-green-50 p-3 rounded-lg">
                    <p className="font-medium">{order.user.firstName} {order.user.lastName}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city} {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phoneNumber && (
                      <p>📞 {order.shippingAddress.phoneNumber}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <Separator className="my-3" />
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Mode de livraison
                  </p>
                  <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-lg">
                    <p className="font-medium">🏪 Retrait au magasin</p>
                    <p className="text-xs">Le client viendra récupérer sa commande</p>
                  </div>
                </div>
              )}
              
              {/* Adresses des métadonnées (legacy) */}
              {(billingAddress || shippingAddress) && (
                <div>
                  <Separator className="my-3" />
                  <p className="font-medium mb-2 text-xs text-muted-foreground">Informations legacy</p>
                  {billingAddress && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Facturation (metadata): {billingAddress.street}, {billingAddress.city}</p>
                    </div>
                  )}
                  {shippingAddress && shippingAddress !== billingAddress && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Livraison (metadata): {shippingAddress.street}, {shippingAddress.city}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.notes || notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes de la commande</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                  </div>
                )}
                {notes && notes !== order.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes legacy (metadata)</p>
                    <p className="text-sm bg-yellow-50 p-3 rounded-lg">{notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </div>
  );
} 
 