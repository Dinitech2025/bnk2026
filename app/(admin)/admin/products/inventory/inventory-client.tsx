'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ArrowUpDown, Package, Edit, TrendingUp, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Image from 'next/image';
import Link from 'next/link';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { ResponsiveList } from '@/components/ui/responsive-list';
import { PageHeader } from '@/components/ui/page-header';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  inventory: number;
  price: number;
  images: Array<{ path: string }>;
  category: { name: string } | null;
  variations: Array<{ inventory: number }>;
  totalInventory: number;
}

interface InventoryClientProps {
  products: Product[];
  currencySettings: {
    currency: string;
    currencySymbol: string;
  };
}

type SortField = "name" | "inventory" | "category" | "price";
type SortOrder = "asc" | "desc";

function InventoryCard({ product }: { product: Product }) {
  const getStockStatus = (inventory: number) => {
    if (inventory > 10) return { color: 'bg-green-100 text-green-800', label: 'En stock' };
    if (inventory > 0) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock faible' };
    return { color: 'bg-red-100 text-red-800', label: 'Rupture' };
  };

  const stockStatus = getStockStatus(product.totalInventory);

  return (
    <div className="rounded-lg border bg-white p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* Image du produit */}
        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {product.images[0]?.path ? (
            <Image 
              src={product.images[0].path} 
              alt={product.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          )}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-sm sm:text-base text-gray-900 break-words leading-tight"
                title={product.name}
              >
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {product.sku || 'Sans référence'}
                </span>
                {product.category && (
                  <Badge variant="secondary" className="text-xs">
                    {product.category.name}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 ml-2">
              <Link href={`/admin/products/inventory/${product.id}/adjust`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                  title="Ajuster stock"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {product.variations.length > 0 && (
                <Link href={`/admin/products/${product.id}/variations`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-purple-100 hover:text-purple-600"
                    title="Gérer variations"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Informations de stock */}
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                <PriceWithConversion price={product.price} />
              </span>
              <Badge className={`text-xs ${stockStatus.color}`}>
                {product.totalInventory} en stock
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>{product.inventory} unités (produit principal)</div>
              {product.variations.length > 0 && (
                <div>
                  {product.variations.reduce((sum, v) => sum + (v.inventory || 0), 0)} unités (variations)
                </div>
              )}
              {product.variations.length > 0 && (
                <div className="text-purple-600">
                  {product.variations.length} variation(s)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryClient({ products: initialProducts, currencySettings }: InventoryClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const categories = Array.from(new Set(products.map(p => p.category?.name).filter((name): name is string => Boolean(name))));

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, sortField, sortOrder, statusFilter, categoryFilter, products]);

  const applyFiltersAndSort = () => {
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
    if (statusFilter !== "all") {
      filtered = filtered.filter(product => {
        const stock = product.totalInventory;
        switch (statusFilter) {
          case "in_stock": return stock > 10;
          case "low_stock": return stock > 0 && stock <= 10;
          case "out_of_stock": return stock === 0;
          default: return true;
        }
      });
    }

    // Filtrage par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category?.name === categoryFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "inventory":
          aValue = a.totalInventory;
          bValue = b.totalInventory;
          break;
        case "category":
          aValue = a.category?.name?.toLowerCase() || '';
          bValue = b.category?.name?.toLowerCase() || '';
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleResetFilters = () => {
    clearSearch();
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? 
      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : 
      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  const getStockStatus = (inventory: number) => {
    if (inventory > 10) return { color: 'bg-green-100 text-green-800', label: 'En stock' };
    if (inventory > 0) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock faible' };
    return { color: 'bg-red-100 text-red-800', label: 'Rupture' };
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestion du stock"
        count={filteredProducts.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        actions={
          <Link href="/admin/products/inventory/adjust">
            <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Ajuster le stock
            </Button>
          </Link>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="in_stock">En stock</SelectItem>
              <SelectItem value="low_stock">Stock faible</SelectItem>
              <SelectItem value="out_of_stock">Rupture</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="rounded-lg border">
        <ResponsiveList
          gridChildren={
            paginatedProducts.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                  <>
                    Aucun produit ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={handleResetFilters}
                          className="ml-2"
                        >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucun produit disponible
                    <div className="text-xs mt-2">
                      Ajoutez des produits pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <InventoryCard key={product.id} product={product} />
              ))
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  <div className="flex items-center">
                    Produit {renderSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("inventory")} className="cursor-pointer">
                  <div className="flex items-center">
                    Stock Total {renderSortIcon("inventory")}
                  </div>
                </TableHead>
                <TableHead>Détail Stock</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead onClick={() => handleSort("category")} className="cursor-pointer">
                  <div className="flex items-center">
                    Catégorie {renderSortIcon("category")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                  <div className="flex items-center">
                    Prix {renderSortIcon("price")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                      <>
                        Aucun produit ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={handleResetFilters}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucun produit disponible
                        <div className="text-xs mt-2">
                          Ajoutez des produits pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.totalInventory);
                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50 group">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {product.images[0]?.path ? (
                              <Image 
                                src={product.images[0].path} 
                                alt={product.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900" title={product.name}>
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.variations.length > 0 ? 
                                `${product.variations.length} variation(s)` : 
                                'Pas de variations'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${stockStatus.color}`}>
                          {product.totalInventory} en stock
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>{product.inventory} unités (produit)</div>
                          {product.variations.length > 0 && (
                            <div>
                              {product.variations.reduce((sum, v) => sum + (v.inventory || 0), 0)} unités (variations)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {product.category?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        <PriceWithConversion price={product.price} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/products/inventory/${product.id}/adjust`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                              title="Ajuster stock"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {product.variations.length > 0 && (
                            <Link href={`/admin/products/${product.id}/variations`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-purple-100 hover:text-purple-600"
                                title="Gérer variations"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ResponsiveList>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={handlePreviousPage}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  if (totalPages <= 5) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageClick(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  let pageNumber = page;
                  if (currentPage > 3) {
                    pageNumber = currentPage - 2 + i;
                  }
                  if (pageNumber > totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageClick(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={handleNextPage}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
} 