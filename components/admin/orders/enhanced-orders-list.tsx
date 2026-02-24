'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Edit2, 
  Eye, 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Download,
  Trash2,
  CheckSquare,
  Square,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Package,
  User,
  Clock,
  TrendingUp,
  FileText,
  Mail,
  Truck,
  PlusCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { DeliveryNoteModal } from './delivery-note-modal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

import OrderStatusBadge from '@/components/admin/orders/order-status-badge';
import { PaymentModal } from '@/components/admin/orders/payment-modal';
import { InvoiceModal } from '@/components/admin/orders/invoice-modal';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { OrderTotalDisplay } from './order-total-display';
import { RevenueDisplay } from './revenue-display';
import { Pagination } from '@/components/ui/pagination';

// Types
interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  metadata: string | null;
  product?: { id: string; name: string } | null;
  service?: { id: string; name: string } | null;
  offer?: { id: string; name: string } | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string | null;
  createdAt: string;
  status: string;
  feeAmount?: number | null;
  netAmount?: number | null;
  paymentExchangeRate?: number | null;
  originalAmount?: number | null;
  paymentDisplayCurrency?: string | null;
  paymentBaseCurrency?: string | null;
}

interface OrderWithRelations {
  id: string;
  orderNumber?: string | null;
  userId: string;
  status: string;
  paymentStatus: string;
  currency: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items: OrderItem[];
  payments: Payment[];
  billingAddress?: any;
  shippingAddress?: any;
  // Champs de taux de change
  exchangeRates?: any;
  displayCurrency?: string | null;
  exchangeRate?: number | null;
  baseCurrency?: string | null;
  originalTotal?: number | null;
  shippingCost?: number | null;
}

interface OrdersStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  thisMonthOrders: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface EnhancedOrdersListProps {
  orders: OrderWithRelations[];
  stats: OrdersStats;
  pagination: PaginationData;
}

// Filtres disponibles
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PARTIALLY_PAID', label: 'Payée partiellement' },
  { value: 'PAID', label: 'Payée' },
  { value: 'PROCESSING', label: 'En cours' },
  { value: 'SHIPPED', label: 'Expédiée' },
  { value: 'DELIVERED', label: 'Livrée' },
  { value: 'CANCELLED', label: 'Annulée' },
  { value: 'REFUNDED', label: 'Remboursée' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les paiements' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PARTIALLY_PAID', label: 'Partiellement payé' },
  { value: 'PAID', label: 'Payé' },
];

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Plus récent' },
  { value: 'createdAt_asc', label: 'Plus ancien' },
  { value: 'total_desc', label: 'Montant décroissant' },
  { value: 'total_asc', label: 'Montant croissant' },
  { value: 'orderNumber_asc', label: 'Numéro de commande' },
];

export function EnhancedOrdersList({ orders, stats, pagination }: EnhancedOrdersListProps) {
  const router = useRouter();
  
  console.log('🔍 EnhancedOrdersList rendu:', {
    ordersCount: orders.length,
    statsTotal: stats.totalOrders,
    paginationTotal: pagination.totalCount,
    premièresCommandes: orders.slice(0, 3).map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status
    }))
  });
  
  // États pour les filtres et la sélection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<{ id: string; orderNumber?: string } | null>(null);
  
  // États pour les modales
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderTotal: number;
    currency: string;
    orderNumber?: string;
  }>({
    isOpen: false,
    orderId: '',
    orderTotal: 0,
    currency: 'Ar',
  });
  
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber?: string;
  }>({
    isOpen: false,
    orderId: '',
  });

  // Fonctions utilitaires
  const getPaymentMethod = useCallback((order: OrderWithRelations): string => {
    if (!order.payments || order.payments.length === 0) return 'Non spécifié';
    
    const paymentMethods: { [key: string]: string } = {
      'mobile_money': 'Mobile Money',
      'bank_transfer': 'Virement bancaire',
      'cash': 'Espèce',
      'paypal': 'PayPal'
    };
    
    const uniqueMethods = Array.from(new Set(order.payments.map(p => p.method)));
    const methodLabels = uniqueMethods.map(method => paymentMethods[method] || method);
    
    return methodLabels.length === 1 ? methodLabels[0] : methodLabels.join(' + ');
  }, []);

  const getPaymentStatus = useCallback((order: OrderWithRelations): string => {
    const totalPaid = order.payments?.reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return isNaN(amount) ? sum : sum + amount;
    }, 0) || 0;
    
    const totalOrder = Number(order.total) || 0;
    const remaining = Math.max(0, totalOrder - totalPaid);
    
    if (totalPaid === 0) {
      return `💳 ${totalOrder.toLocaleString('fr-FR')} ${order.currency} à payer`;
    } else if (remaining > 0) {
      return `⚠️ ${totalPaid.toLocaleString('fr-FR')} ${order.currency} payé, ${remaining.toLocaleString('fr-FR')} ${order.currency} restant`;
    } else {
      return `✅ Entièrement payé`;
    }
  }, []);

  // Filtrage et tri des commandes
  const filteredAndSortedOrders = useMemo(() => {
    console.log('🔍 Filtrage commandes:', {
      ordersInput: orders.length,
      searchTerm,
      statusFilter,
      paymentStatusFilter
    });
    
    let filtered = orders.filter(order => {
      // Filtre par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.user.email.toLowerCase().includes(searchLower) ||
          `${order.user.firstName} ${order.user.lastName}`.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower);
        
        if (!matches) return false;
      }
      
      // Filtre par statut
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Filtre par statut de paiement
      if (paymentStatusFilter !== 'all' && order.paymentStatus !== paymentStatusFilter) {
        return false;
      }
      
      // Filtre par date
      if (dateRange?.from || dateRange?.to) {
        const orderDate = new Date(order.createdAt);
        if (dateRange.from && orderDate < dateRange.from) return false;
        if (dateRange.to && orderDate > dateRange.to) return false;
      }
      
      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      const [field, direction] = sortBy.split('_');
      const multiplier = direction === 'desc' ? -1 : 1;
      
      switch (field) {
        case 'createdAt':
          return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'total':
          return multiplier * (a.total - b.total);
        case 'orderNumber':
          return multiplier * ((a.orderNumber || '').localeCompare(b.orderNumber || ''));
        default:
          return 0;
      }
    });

    console.log('✅ Résultat filtrage:', {
      commandesFiltrées: filtered.length,
      commandesTotales: orders.length,
      premièresFiltrées: filtered.slice(0, 3).map(o => o.orderNumber)
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, paymentStatusFilter, dateRange, sortBy]);

  // Gestion de la sélection
  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === filteredAndSortedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredAndSortedOrders.map(order => order.id)));
    }
  }, [selectedOrders.size, filteredAndSortedOrders]);

  const handleSelectOrder = useCallback((orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  }, [selectedOrders]);

  // Actions en lot
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedOrders.size === 0) {
      toast.error('Aucune commande sélectionnée');
      return;
    }

    try {
      switch (action) {
        case 'export':
          // TODO: Implémenter l'export
          toast.success(`Export de ${selectedOrders.size} commande(s) en cours...`);
          break;
        case 'delete':
          // TODO: Implémenter la suppression
          toast.success(`${selectedOrders.size} commande(s) supprimée(s)`);
          setSelectedOrders(new Set());
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error('Erreur lors de l\'action en lot');
    }
  }, [selectedOrders]);

  // Gestion des modales
  const openPaymentModal = useCallback((order: OrderWithRelations) => {
    const totalPaid = order.payments?.reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return isNaN(amount) ? sum : sum + amount;
    }, 0) || 0;
    
    const totalOrder = Number(order.total) || 0;
    const remainingAmount = Math.max(0, totalOrder - totalPaid);
    
    setPaymentModal({
      isOpen: true,
      orderId: order.id,
      orderTotal: remainingAmount,
      currency: order.currency,
      orderNumber: order.orderNumber || undefined
    });
  }, []);

  const openInvoiceModal = useCallback((order: OrderWithRelations) => {
    setInvoiceModal({
      isOpen: true,
      orderId: order.id,
      orderNumber: order.orderNumber || undefined
    });
  }, []);

  // Fonction pour ouvrir le modal du bon de commande
  const openDeliveryModal = useCallback((orderId: string, orderNumber?: string) => {
    setSelectedOrderForDelivery({ id: orderId, orderNumber });
    setDeliveryModalOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentModal(prev => ({ ...prev, isOpen: false }));
    router.refresh();
    toast.success('Paiement enregistré avec succès');
  }, [router]);

  // Fonction pour traduire les statuts en français
  const getStatusInFrench = useCallback((status: string): string => {
    const statusTranslations: { [key: string]: string } = {
      'PENDING': 'En attente',
      'PARTIALLY_PAID': 'Payée partiellement',
      'PAID': 'Payée',
      'PROCESSING': 'En cours',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'REFUNDED': 'Remboursée',
      // Compatibilité avec les anciens statuts
      'CONFIRMED': 'Payée',
      'QUOTE': 'En attente'
    };
    return statusTranslations[status] || status;
  }, []);

  // Fonction pour changer le statut d'une commande
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    // Si le statut est PAID ou PARTIALLY_PAID, ouvrir le modal de paiement au lieu de changer directement le statut
    if (newStatus === 'PAID' || newStatus === 'PARTIALLY_PAID') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Pour PAID, vérifier si la commande est déjà entièrement payée
        if (newStatus === 'PAID' && order.paymentStatus === 'PAID') {
          toast.error('Cette commande est déjà entièrement payée');
          return;
        }
        openPaymentModal(order);
      }
      return;
    }

    setLoading(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `Erreur ${response.status}: ${response.statusText}`;
        console.error('Erreur API détaillée:', errorData);
        throw new Error(errorMessage);
      }

      toast.success(`Statut mis à jour vers "${getStatusInFrench(newStatus)}"`);
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(null);
    }
  }, [orders, router, getStatusInFrench]);

  // Gestion des clics sur les lignes
  const handleRowClick = useCallback((orderId: string, event: React.MouseEvent) => {
    // Éviter la navigation si on clique sur un bouton, checkbox ou lien
    const target = event.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    
    router.push(`/admin/orders/${orderId}`);
  }, [router]);

  return (
    <div className="space-y-3">
      {/* En-tête fusionné avec statistiques et recherche */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          {/* Titre et actions */}
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-bold text-gray-900">Gestion des Commandes</h1>
            <Link 
              href="/admin/orders/new" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors">
              <PlusCircle className="h-3.5 w-3.5" />
              Nouvelle Commande
            </Link>
          </div>

          {/* Statistiques complètes avec cadres */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-3 pb-3 border-b border-gray-100">
            {/* Total Commandes */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Total</p>
                    <p className="text-lg font-bold text-blue-900">{stats.totalOrders}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">+{stats.todayOrders}</p>
                  <p className="text-xs text-blue-500">aujourd'hui</p>
                </div>
              </div>
            </div>

            {/* En Attente */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-yellow-600 font-medium">En Attente</p>
                    <p className="text-lg font-bold text-yellow-900">{stats.pendingOrders}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-yellow-600">
                    {stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}%
                  </p>
                  <p className="text-xs text-yellow-500">du total</p>
                </div>
              </div>
            </div>

            {/* Partiellement Payées */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Partielles</p>
                    <p className="text-lg font-bold text-orange-900">{stats.partiallyPaidOrders || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-600">
                    {stats.totalOrders > 0 ? Math.round(((stats.partiallyPaidOrders || 0) / stats.totalOrders) * 100) : 0}%
                  </p>
                  <p className="text-xs text-orange-500">du total</p>
                </div>
              </div>
            </div>

            {/* Payées */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Payées</p>
                    <p className="text-lg font-bold text-green-900">{stats.paidOrders}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">{stats.conversionRate || 0}%</p>
                  <p className="text-xs text-green-500">conversion</p>
                </div>
              </div>
            </div>

            {/* Chiffre d'Affaires */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">CA Total</p>
                    <p className="text-lg font-bold text-emerald-900">
                      <RevenueDisplay 
                        totalRevenueAr={stats.totalRevenue || 0}
                        totalRevenueUSD={stats.totalRevenueUSD || 0}
                        totalRevenueEUR={stats.totalRevenueEUR || 0}
                      />
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600">
                    {stats.averageOrderValue >= 1000 
                      ? `${Math.round(stats.averageOrderValue / 1000)}K` 
                      : Math.round(stats.averageOrderValue || 0)}
                  </p>
                  <p className="text-xs text-emerald-500">panier moy</p>
                </div>
              </div>
            </div>

            {/* Croissance */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium">Croissance</p>
                    <p className="text-lg font-bold text-purple-900">
                      {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth || 0}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-600">{stats.thisWeekOrders || 0}</p>
                  <p className="text-xs text-purple-500">cette sem.</p>
                </div>
              </div>
            </div>
          </div>


          {/* Recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                <Input
                  placeholder="Rechercher par numéro, client, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 h-8 px-2.5 text-xs"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtres
                {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
              
              {selectedOrders.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                      Actions ({selectedOrders.size})
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Exporter
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 mt-2 border-t">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Paiement" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal h-8 text-sm">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Période"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Résumé des résultats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
        <div className="flex items-center gap-3">
          <span>
            {filteredAndSortedOrders.length} sur {orders.length} • Page {pagination.currentPage}/{pagination.totalPages}
            {selectedOrders.size > 0 && ` • ${selectedOrders.size} sélectionnées`}
          </span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            💡 Clic pour détails
          </span>
        </div>
        
        {(searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all' || dateRange) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentStatusFilter('all');
              setDateRange(undefined);
            }}
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Tableau des commandes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead className="w-10 py-2">
                    <Checkbox
                      checked={selectedOrders.size === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="py-2 text-xs font-medium">Commande</TableHead>
                  <TableHead className="py-2 text-xs font-medium">Client</TableHead>
                  <TableHead className="py-2 text-xs font-medium">Statut</TableHead>
                  <TableHead className="py-2 text-xs font-medium">Paiement</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-right">Total</TableHead>
                  <TableHead className="py-2 text-xs font-medium">Date</TableHead>
                  <TableHead className="w-16 py-2 text-xs font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="hover:bg-muted/50 cursor-pointer transition-colors h-12"
                    onClick={(e) => handleRowClick(order.id, e)}
                  >
                    <TableCell className="py-2">
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">
                          {order.orderNumber || `#${order.id.substring(0, 8)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">
                          {order.user.firstName} {order.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-32">
                          {order.user.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="p-0 hover:bg-transparent h-auto"
                            disabled={loading === order.id}
                          >
                            <OrderStatusBadge status={order.status} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PENDING')}
                            disabled={loading === order.id}
                          >
                            En attente
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PARTIALLY_PAID')}
                            disabled={loading === order.id}
                          >
                            Payée partiellement
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PAID')}
                            disabled={loading === order.id}
                          >
                            Payée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                            disabled={loading === order.id}
                          >
                            En cours
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                            disabled={loading === order.id}
                          >
                            Expédiée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                            disabled={loading === order.id}
                          >
                            Livrée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                            disabled={loading === order.id}
                          >
                            Annulée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'REFUNDED')}
                            disabled={loading === order.id}
                          >
                            Remboursée
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-xs">
                            {getPaymentMethod(order)}
                          </span>
                          {order.payments && order.payments.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                              {order.payments.length}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getPaymentStatus(order)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2 text-right">
                      <div className="text-sm font-medium">
                        <OrderTotalDisplay 
                          price={order.total}
                          currency={order.currency}
                          exchangeRates={order.exchangeRates}
                          displayCurrency={order.displayCurrency}
                          exchangeRate={order.exchangeRate}
                          payments={order.payments}
                        />
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          {format(new Date(order.createdAt), 'dd/MM/yy', { locale: fr })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}/edit`}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openInvoiceModal(order)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Facture
                          </DropdownMenuItem>
                          {(['DELIVERED', 'FINISHED', 'SHIPPING', 'PAID', 'CONFIRMED'].includes(order.status)) && (
                            <DropdownMenuItem 
                              onClick={() => openDeliveryModal(order.id, order.orderNumber)}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Bon de livraison
                            </DropdownMenuItem>
                          )}
                          {order.paymentStatus !== 'PAID' && (
                            <DropdownMenuItem onClick={() => openPaymentModal(order)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Paiement
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune commande trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all' || dateRange
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par créer votre première commande'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && paymentStatusFilter === 'all' && !dateRange && (
                <Button asChild>
                  <Link href="/admin/orders/new">
                    Créer une commande
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination compacte */}
      <div className="flex items-center justify-between gap-2 mt-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Afficher</span>
          <Select 
            value={pagination.limit.toString()} 
            onValueChange={(value) => {
              const params = new URLSearchParams(window.location.search);
              params.set('limit', value);
              params.set('page', '1'); // Reset à la première page
              router.push(`?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>par page</span>
        </div>
        
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
        />
      </div>

      {/* Modales */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        orderId={paymentModal.orderId}
        orderTotal={paymentModal.orderTotal}
        currency={paymentModal.currency}
        orderNumber={paymentModal.orderNumber}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal(prev => ({ ...prev, isOpen: false }))}
        orderId={invoiceModal.orderId}
        orderNumber={invoiceModal.orderNumber}
      />

      <DeliveryNoteModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        orderId={selectedOrderForDelivery?.id || ''}
        orderNumber={selectedOrderForDelivery?.orderNumber}
      />
    </div>
  );
}
