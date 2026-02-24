'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Edit, 
  TrendingUp, 
  Filter, 
  ChevronUp, 
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Plus,
  Minus,
  DollarSign,
  Calendar,
  Tag,
  Archive,
  Search,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import Link from 'next/link';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { useToast } from '@/components/ui/use-toast';

// Types
interface EnhancedProduct {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  inventory: number;
  price: number;
  compareAtPrice: number | null;
  pricingType: string;
  minPrice: number | null;
  maxPrice: number | null;
  published: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{ path: string; url?: string }>;
  category: { id: string; name: string; slug: string } | null;
  variations: Array<{
    id: string;
    sku: string | null;
    inventory: number;
    price: number;
    attributes: Array<{ name: string; value: string }>;
  }>;
  totalInventory: number;
  stockValue: number;
  stockStatus: 'critical' | 'low' | 'normal' | 'high';
  hasVariations: boolean;
  variationsCount: number;
  ordersCount: number;
  lastUpdated: Date;
}

interface InventoryStats {
  totalProducts: number;
  publishedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockUnits: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface InventoryEnhancedClientProps {
  products: EnhancedProduct[];
  currencySettings: {
    currency: string;
    currencySymbol: string;
    lowStockThreshold: number;
    criticalStockThreshold: number;
  };
  inventoryStats: InventoryStats;
  categories: Category[];
}

type ViewMode = 'grid' | 'table' | 'analytics';
type SortField = 'name' | 'inventory' | 'price' | 'category' | 'updated' | 'orders' | 'value';
type SortOrder = 'asc' | 'desc';
type StockFilter = 'all' | 'critical' | 'low' | 'normal' | 'high' | 'out_of_stock';

// Composant de statistiques
function InventoryStatsCards({ stats, products }: { stats: InventoryStats; products: EnhancedProduct[] }) {
  const totalStockValue = products.reduce((sum, product) => sum + product.stockValue, 0);
  const criticalProducts = products.filter(p => p.stockStatus === 'critical').length;
  const lowStockProducts = products.filter(p => p.stockStatus === 'low').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            {stats.publishedProducts} publiés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PriceWithConversion price={totalStockValue} />
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalStockUnits} unités
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {criticalProducts + lowStockProducts}
          </div>
          <p className="text-xs text-muted-foreground">
            {criticalProducts} critique, {lowStockProducts} faible
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.outOfStockProducts}
          </div>
          <p className="text-xs text-muted-foreground">
            Produits en rupture
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant de carte produit améliorée
function EnhancedProductCard({ product }: { product: EnhancedProduct }) {
  const getStockStatusConfig = (status: string) => {
    switch (status) {
      case 'critical':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: XCircle, 
          label: 'Critique' 
        };
      case 'low':
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: AlertTriangle, 
          label: 'Faible' 
        };
      case 'high':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: TrendingUp, 
          label: 'Élevé' 
        };
      default:
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle, 
          label: 'Normal' 
        };
    }
  };

  const statusConfig = getStockStatusConfig(product.stockStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {product.images[0]?.path || product.images[0]?.url ? (
                <Image 
                  src={product.images[0].url || product.images[0].path} 
                  alt={product.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate" title={product.name}>
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {product.sku || 'Sans SKU'}
                </span>
                {product.category && (
                  <Badge variant="outline" className="text-xs">
                    {product.category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <Badge className={`text-xs ${statusConfig.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {product.totalInventory}
            </Badge>
            {product.featured && (
              <Badge variant="secondary" className="text-xs">
                Vedette
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Prix et valeur */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">
                <PriceWithConversion price={product.price} />
              </div>
              <div className="text-xs text-gray-500">
                Valeur: <PriceWithConversion price={product.stockValue} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Type</div>
              <Badge variant="outline" className="text-xs">
                {product.pricingType || 'FIXED'}
              </Badge>
            </div>
          </div>

          {/* Détails stock */}
          {product.hasVariations ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Principal: {product.inventory}</span>
                <span>Variations: {product.totalInventory - product.inventory}</span>
              </div>
              <Progress 
                value={(product.inventory / product.totalInventory) * 100} 
                className="h-1"
              />
              <div className="text-xs text-purple-600">
                {product.variationsCount} variation(s)
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              Stock unique: {product.inventory} unités
            </div>
          )}

          {/* Statistiques */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{product.ordersCount} commandes</span>
            <span>MAJ: {new Date(product.lastUpdated).toLocaleDateString()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Modifier</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/admin/products/inventory/${product.id}/adjust`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Ajuster stock</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {product.hasVariations && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/admin/products/${product.id}/variations`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Gérer variations</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <Link href={`/products/${product.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal
export default function InventoryEnhancedClient({ 
  products: initialProducts, 
  currencySettings, 
  inventoryStats,
  categories 
}: InventoryEnhancedClientProps) {
  const { toast } = useToast();
  
  // États
  const [products, setProducts] = useState<EnhancedProduct[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<EnhancedProduct[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filtrage et tri
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrage par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.category?.name.toLowerCase().includes(term)
      );
    }

    // Filtrage par statut de stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (stockFilter) {
          case 'critical':
            return product.stockStatus === 'critical';
          case 'low':
            return product.stockStatus === 'low';
          case 'normal':
            return product.stockStatus === 'normal';
          case 'high':
            return product.stockStatus === 'high';
          case 'out_of_stock':
            return product.totalInventory === 0;
          default:
            return true;
        }
      });
    }

    // Filtrage par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.id === categoryFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'inventory':
          aValue = a.totalInventory;
          bValue = b.totalInventory;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.category?.name?.toLowerCase() || '';
          bValue = b.category?.name?.toLowerCase() || '';
          break;
        case 'updated':
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        case 'orders':
          aValue = a.ordersCount;
          bValue = b.ordersCount;
          break;
        case 'value':
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchTerm, stockFilter, categoryFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStockFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implémenter l'export CSV/Excel
    toast({
      title: "Export en cours",
      description: "Fonctionnalité d'export en développement",
    });
  };

  const handleBulkAction = (action: string) => {
    // TODO: Implémenter les actions en lot
    toast({
      title: "Action en lot",
      description: `Action "${action}" sur ${selectedProducts.length} produits`,
    });
  };

  // Handlers pour la pagination
  const handleFirstPage = () => setCurrentPage(1);
  const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => setCurrentPage(totalPages);
  const handlePageClick = (page: number) => setCurrentPage(page);
  
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Avancée de l'Inventaire</h1>
          <p className="text-muted-foreground">
            Contrôle complet de votre stock avec analytics et alertes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Link href="/admin/products/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Produit
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <InventoryStatsCards stats={inventoryStats} products={filteredAndSortedProducts} />

      {/* Alertes */}
      {inventoryStats.outOfStockProducts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Attention - Ruptures de stock</AlertTitle>
          <AlertDescription className="text-red-700">
            {inventoryStats.outOfStockProducts} produit(s) sont en rupture de stock et nécessitent un réapprovisionnement.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, SKU, catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={stockFilter} onValueChange={(value: StockFilter) => setStockFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category._count.products})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="inventory">Stock</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="category">Catégorie</SelectItem>
                  <SelectItem value="updated">Mise à jour</SelectItem>
                  <SelectItem value="orders">Commandes</SelectItem>
                  <SelectItem value="value">Valeur</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('analytics')}
                  className="rounded-l-none"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>

              {(searchTerm || stockFilter !== 'all' || categoryFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenu principal */}
      <div className="space-y-4">
        {/* Informations de résultats */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            {filteredAndSortedProducts.length} produit(s) trouvé(s)
            {searchTerm && ` pour "${searchTerm}"`}
          </span>
          <div className="flex items-center gap-2">
            <span>Afficher:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
                <SelectItem value="96">96</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vue grille */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <EnhancedProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Vue tableau */}
        {viewMode === 'table' && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    <div className="flex items-center">
                      Produit
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('inventory')} className="cursor-pointer">
                    <div className="flex items-center">
                      Stock
                      {sortField === 'inventory' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('price')} className="cursor-pointer">
                    <div className="flex items-center">
                      Prix
                      {sortField === 'price' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('value')} className="cursor-pointer">
                    <div className="flex items-center">
                      Valeur Stock
                      {sortField === 'value' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {product.images[0]?.path || product.images[0]?.url ? (
                            <Image 
                              src={product.images[0].url || product.images[0].path} 
                              alt={product.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku || 'Sans SKU'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{product.totalInventory}</div>
                        {product.hasVariations && (
                          <div className="text-xs text-gray-500">
                            {product.inventory} + {product.totalInventory - product.inventory} var.
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriceWithConversion price={product.price} />
                    </TableCell>
                    <TableCell>
                      <PriceWithConversion price={product.stockValue} />
                    </TableCell>
                    <TableCell>
                      <Badge className={`${
                        product.stockStatus === 'critical' ? 'bg-red-100 text-red-800' :
                        product.stockStatus === 'low' ? 'bg-orange-100 text-orange-800' :
                        product.stockStatus === 'high' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.stockStatus === 'critical' ? 'Critique' :
                         product.stockStatus === 'low' ? 'Faible' :
                         product.stockStatus === 'high' ? 'Élevé' : 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.category?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/inventory/${product.id}/adjust`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {product.hasVariations && (
                          <Link href={`/admin/products/${product.id}/variations`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <TrendingUp className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Vue analytics */}
        {viewMode === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics de l'Inventaire</CardTitle>
              <CardDescription>
                Visualisation avancée des données de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics en développement</h3>
                <p>Les graphiques et analyses avancées seront disponibles prochainement.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Avancée */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedProducts.length)} sur {filteredAndSortedProducts.length} produits
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Bouton première page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFirstPage}
                    disabled={currentPage === 1}
                  >
                    ««
                  </Button>
                  
                  {/* Bouton page précédente */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    ‹ Précédent
                  </Button>

                  {/* Numéros de pages */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber = i + 1;
                      
                      // Logique pour afficher les bonnes pages autour de la page actuelle
                      if (totalPages > 5) {
                        if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                      }

                      if (pageNumber > totalPages) return null;

                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageClick(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Points de suspension si nécessaire */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-sm text-muted-foreground">...</span>
                  )}

                  {/* Dernière page si pas visible */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLastPage}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  )}
                  
                  {/* Bouton page suivante */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Suivant ›
                  </Button>
                  
                  {/* Bouton dernière page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLastPage}
                    disabled={currentPage === totalPages}
                  >
                    »»
                  </Button>
                </div>

                {/* Sélecteur de page rapide */}
                <div className="flex items-center space-x-2 text-sm">
                  <span>Aller à la page:</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={handlePageInputChange}
                    className="w-16 h-8 text-center"
                  />
                  <span>sur {totalPages}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
