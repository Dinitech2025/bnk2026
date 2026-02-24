'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Eye, Search, ChevronUp, ChevronDown, Filter, X, Truck, Receipt, CreditCard } from 'lucide-react';
import OrderStatusBadge from '@/components/admin/orders/order-status-badge';
import { PaymentModal } from '@/components/admin/orders/payment-modal';
import { InvoiceModal } from '@/components/admin/orders/invoice-modal';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceDisplay } from '@/components/ui/price-display';
import { CurrencySelector } from '@/components/ui/currency-selector';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { InvoiceGeneratorButton } from '@/components/admin/orders/invoice-generator';
import { toast } from '@/components/ui/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type OrderWithRelations = {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  orderNumber: string | null;
  user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  };
  items: Array<{
  id: string;
    orderId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
    productId: string | null;
    serviceId: string | null;
    offerId: string | null;
    metadata: string | null;
    offer: { id: string; name: string; } | null;
    product: { id: string; name: string; } | null;
    service: { id: string; name: string; } | null;
  }>;
};

type SortField = "date" | "total" | "status" | "client";
type SortOrder = "asc" | "desc";

export default function OrdersList({ orders }: { orders: OrderWithRelations[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    currency: 'Ar'
  });

  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber?: string;
  }>({
    isOpen: false,
    orderId: '',
    orderNumber: undefined
  });


  // Fonction pour traduire les statuts en français
  const getStatusInFrench = (status: string): string => {
    const statusTranslations: { [key: string]: string } = {
      'QUOTE': 'Devis en attente de paiement',
      'PENDING': 'En attente',
      'PARTIALLY_PAID': 'Payée partiellement',
      'PAID': 'Commande payée',
      'PROCESSING': 'En traitement',
      'SHIPPING': 'En livraison',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'FINISHED': 'Terminée',
      'CONFIRMED': 'Commande payée'
    };
    return statusTranslations[status] || status;
  };

  // Fonction pour obtenir le mode de paiement (safe pour SSR)
  const getPaymentMethod = (order: OrderWithRelations): string => {
    try {
      // Si il y a des paiements, lister toutes les méthodes utilisées
      if (order.payments && order.payments.length > 0) {
        const paymentMethods: { [key: string]: string } = {
          'mobile_money': 'Mobile Money',
          'bank_transfer': 'Virement bancaire',
          'cash': 'Espèce',
          'paypal': 'PayPal'
        };

        // Récupérer toutes les méthodes uniques utilisées
        const uniqueMethods = [...new Set(order.payments.map(payment => payment.method))];
        
        // Convertir en libellés français
        const methodLabels = uniqueMethods.map(method => 
          paymentMethods[method] || method
        );

        // Si une seule méthode, l'afficher directement
        if (methodLabels.length === 1) {
          return methodLabels[0];
        }
        
        // Si plusieurs méthodes, les joindre avec " + "
        return methodLabels.join(' + ');
      }

      // Sinon, chercher dans les métadonnées du premier item
      if (order.items && order.items.length > 0 && order.items[0].metadata) {
        try {
          const metadata = JSON.parse(order.items[0].metadata);
          if (metadata.paymentMethod) {
            const paymentMethods: { [key: string]: string } = {
              'mobile_money': 'Mobile Money',
              'bank_transfer': 'Virement bancaire',
              'cash_on_delivery': 'Paiement à la livraison',
              'credit_card': 'Carte bancaire',
              'card': 'Carte bancaire',
              'paypal': 'PayPal'
            };
            return paymentMethods[metadata.paymentMethod] || metadata.paymentMethod;
          }
        } catch (error) {
          // Silently handle JSON parsing errors
        }
      }
      return 'Non spécifié';
    } catch (error) {
      return 'Non spécifié';
    }
  };

  // Fonction pour afficher le statut de paiement (safe pour SSR)
  const getPaymentStatus = (order: OrderWithRelations): string => {
    try {
      // Calculer le total payé à partir des paiements réels
      const totalPaid = order.payments?.reduce((sum, payment) => {
        const amount = Number(payment.amount);
        return isNaN(amount) ? sum : sum + amount;
      }, 0) || 0;
      
      const totalOrder = Number(order.total) || 0;
      const remaining = Math.max(0, totalOrder - totalPaid);

      // Afficher selon le statut de paiement
      if (order.paymentStatus === 'PAID') {
        return `✅ Entièrement payé`;
      } else if (order.paymentStatus === 'PARTIALLY_PAID') {
        return `⚠️ ${totalPaid.toLocaleString('fr-FR')} ${order.currency || 'Ar'} payé, ${remaining.toLocaleString('fr-FR')} ${order.currency || 'Ar'} restant`;
      } else {
        return `💳 ${totalOrder.toLocaleString('fr-FR')} ${order.currency || 'Ar'} à payer`;
      }
    } catch (error) {
      return `💳 ${order.total} ${order.currency || 'Ar'} à payer`;
    }
  };

  // Fonction pour ouvrir le modal de paiement
  const openPaymentModal = (order: OrderWithRelations) => {
    // Calculer le montant restant à payer
    const totalPaid = order.payments?.reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return isNaN(amount) ? sum : sum + amount;
    }, 0) || 0;
    
    const totalOrder = Number(order.total) || 0;
    const remainingAmount = Math.max(0, totalOrder - totalPaid);
    
    setPaymentModal({
      isOpen: true,
      orderId: order.id,
      orderTotal: remainingAmount, // Utiliser le montant restant au lieu du total
      currency: order.currency,
      orderNumber: order.orderNumber || undefined
    });
  };

  // Fonction pour fermer le modal de paiement
  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      orderId: '',
      orderTotal: 0,
      currency: 'Ar'
    });
  };

  // Fonction appelée après un paiement réussi
  const handlePaymentSuccess = () => {
    router.refresh();
  };

  // Fonction pour changer le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Si le statut est PAID, ouvrir le modal de paiement au lieu de changer directement le statut
    if (newStatus === 'PAID') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Vérifier si la commande est déjà entièrement payée
        if (order.paymentStatus === 'PAID') {
          toast({
            title: "Commande déjà payée",
            description: "Cette commande est déjà entièrement payée",
            variant: "default"
          });
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

      if (!response.ok) throw new Error('Erreur de mise à jour');
      
      // Rafraîchir la page pour obtenir les dernières données
      router.refresh();

      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  // Fonction pour ouvrir le modal de facture
  const openInvoiceModal = (orderId: string, orderNumber?: string) => {
    setInvoiceModal({
      isOpen: true,
      orderId,
      orderNumber
    });
  };

  // Fonction pour fermer le modal de facture
  const closeInvoiceModal = () => {
    setInvoiceModal({
      isOpen: false,
      orderId: '',
      orderNumber: undefined
    });
  };

  // Fonction pour générer le bon de livraison
  const generateDeliveryNote = async (orderId: string) => {
    setDeliveryLoading(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/delivery-note`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du bon de livraison');
      }
      
      const deliveryData = await response.json();
      const { generateDeliveryNotePDF } = await import('@/lib/delivery-note-generator');
      const pdfDataUrl = await generateDeliveryNotePDF(deliveryData);
      
      const newWindow = window.open('');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Bon de livraison</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; }
                iframe { border: none; width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <iframe src="${pdfDataUrl}"></iframe>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le bon de livraison",
        variant: "destructive"
      });
    } finally {
      setDeliveryLoading(null);
    }
  };


  // Filtrage des commandes
  const filteredOrders = useMemo(() => {
    if (!searchTerm && statusFilter === "all") return orders;
    
    return orders.filter(order => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower) ||
          `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  // Tri des commandes
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "date":
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case "total":
            comparison = Number(a.total) - Number(b.total);
            break;
          case "status":
            comparison = a.status.localeCompare(b.status);
            break;
          case "client":
            const aName = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`;
            const bName = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`;
            comparison = aName.localeCompare(bName);
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [filteredOrders, sortField, sortOrder]);

  // Pagination
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[300px]"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
            </div>
            <Select
              value={statusFilter}
                onValueChange={setStatusFilter}
            >
                <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="QUOTE">Devis en attente de paiement</SelectItem>
                  <SelectItem value="PAID">Payée</SelectItem>
                <SelectItem value="PROCESSING">En traitement</SelectItem>
                  <SelectItem value="SHIPPING">En livraison</SelectItem>
                  <SelectItem value="DELIVERED">Livrée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                  <SelectItem value="FINISHED">Terminée</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sélecteur de devise pour les factures */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Devise pour factures
              </label>
              <CurrencySelector className="w-[150px]" />
            </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("client")}
                >
                  <div className="flex items-center">
                    Client {renderSortIcon("client")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date {renderSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center">
                    Total {renderSortIcon("total")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Statut {renderSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead>Mode de paiement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber || order.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                      {order.user?.firstName || 'N/A'} {order.user?.lastName || ''}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.user?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <PriceDisplay price={Number(order.total)} size="small" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 hover:bg-transparent">
                              <OrderStatusBadge status={order.status} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateOrderStatus(order.id, 'QUOTE')}
                              disabled={loading === order.id}
                            >
                              Devis en attente de paiement
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateOrderStatus(order.id, 'PAID')}
                              disabled={loading === order.id}
                            >
                            Commande payée
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateOrderStatus(order.id, 'PENDING')}
                              disabled={loading === order.id}
                            >
                            En attente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                              disabled={loading === order.id}
                            >
                              En traitement
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateOrderStatus(order.id, 'SHIPPING')}
                              disabled={loading === order.id}
                            >
                            En livraison
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
                              onClick={() => updateOrderStatus(order.id, 'FINISHED')}
                              disabled={loading === order.id}
                            >
                            Terminée
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {getPaymentMethod(order)}
                          </span>
                          {order.payments && order.payments.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {order.payments.length} paiement{order.payments.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getPaymentStatus(order)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {(['DELIVERED', 'FINISHED', 'SHIPPING', 'PAID', 'CONFIRMED'].includes(order.status)) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => generateDeliveryNote(order.id)}
                                  disabled={deliveryLoading === order.id}
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bon de livraison</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Bouton paiement - seulement si pas entièrement payé */}
                        {order.paymentStatus !== 'PAID' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openPaymentModal(order)}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enregistrer un paiement</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openInvoiceModal(order.id, order.orderNumber || undefined)}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Facture</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                              >
                                  <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Voir les détails</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                              >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Modifier</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/orders/${order.id}/delete`)}
                              >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Éléments par page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="20">20 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Affichage de {sortedOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, sortedOrders.length)} sur {sortedOrders.length} commandes
          </p>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page)}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Modal de paiement */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        orderId={paymentModal.orderId}
        orderTotal={paymentModal.orderTotal}
        currency={paymentModal.currency}
        orderNumber={paymentModal.orderNumber}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal de facture */}
      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={closeInvoiceModal}
        orderId={invoiceModal.orderId}
        orderNumber={invoiceModal.orderNumber}
      />
    </div>
  );
} 