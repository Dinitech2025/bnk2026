'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  Package,
  Tag,
  Clock,
  ChevronUp,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Calculator,
  Plane,
  Ship
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { PageHeader } from '@/components/ui/page-header'

interface ProductCategory {
  id: string
  name: string
}

interface ProductAttribute {
  id: string
  name: string
  value: string
}

interface ProductImage {
  id: string
  path: string
  alt: string | null
}

interface ImportedProduct {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice: number | null
  sku: string | null
  barcode: string | null
  inventory: number
  weight: number | null
  dimensions: string | null
  featured: boolean
  published: boolean
  createdAt: string
  updatedAt: string
  category: ProductCategory | null
  images: ProductImage[]
  attributes: ProductAttribute[]
  // Attributs spécifiques aux produits importés
  supplierPrice?: number
  supplierCurrency?: string
  warehouse?: string
  transportMode?: string
  importCost?: number
  transitTime?: string
}

type SortField = "name" | "price" | "inventory" | "importCost" | "warehouse" | "created" | "published"
type SortOrder = "asc" | "desc"

function ImportedProductCard({ product, onEdit, onDelete, onView }: {
  product: ImportedProduct
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
}) {
  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + '...'
    }
    return truncated + '...'
  }

  const getWarehouseFlag = (warehouse: string) => {
    switch (warehouse?.toLowerCase()) {
      case 'france':
        return '🇫🇷'
      case 'usa':
        return '🇺🇸'
      case 'uk':
        return '🇬🇧'
      default:
        return '🌍'
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* Image du produit */}
        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {product.images && product.images[0] ? (
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
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                {truncateText(product.name, 40)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {product.sku || 'Sans référence'}
                </span>
                {product.warehouse && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center">
                    {getWarehouseFlag(product.warehouse)} {product.warehouse.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(product.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(product.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-red-600">
                  <Trash className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Informations du produit */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">
                  <PriceWithConversion price={product.price} />
                </span>
                {product.importCost && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Import: <PriceWithConversion price={product.importCost} />)
                  </span>
                )}
              </div>
              <Badge 
                variant={product.published ? "default" : "secondary"}
                className="text-xs"
              >
                {product.published ? 'Actif' : 'Inactif'}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Stock: {product.inventory}</span>
              <div className="flex items-center gap-1">
                {product.transportMode === 'air' ? (
                  <Plane className="h-3 w-3" />
                ) : (
                  <Ship className="h-3 w-3" />
                )}
                <span>{product.transportMode === 'air' ? 'Aérien' : 'Maritime'}</span>
              </div>
            </div>

            {product.transitTime && (
              <div className="text-xs text-gray-500">
                Délai: {product.transitTime}
              </div>
            )}

            {product.featured && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  Mis en avant
                </Badge>
              </div>
            )}

            <div className="text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(product.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImportedProductsPage() {
  const [products, setProducts] = useState<ImportedProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ImportedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("created")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all")
  const [transportFilter, setTransportFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchProducts = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/products/imported?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Erreur lors du chargement des produits importés')
      
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setProducts([])
        return
      }
      
      setProducts(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des produits importés')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, warehouseFilter, transportFilter, products])

  const applyFiltersAndSort = () => {
    if (!products || products.length === 0) {
      setFilteredProducts([])
      return
    }

    let filtered = [...products]

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.warehouse?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrage par statut
    if (statusFilter !== "all") {
      if (statusFilter === "published") {
        filtered = filtered.filter(product => product.published)
      } else if (statusFilter === "draft") {
        filtered = filtered.filter(product => !product.published)
      } else if (statusFilter === "featured") {
        filtered = filtered.filter(product => product.featured)
      } else if (statusFilter === "out_of_stock") {
        filtered = filtered.filter(product => product.inventory <= 0)
      }
    }

    // Filtrage par entrepôt
    if (warehouseFilter !== "all") {
      filtered = filtered.filter(product => product.warehouse?.toLowerCase() === warehouseFilter)
    }

    // Filtrage par mode de transport
    if (transportFilter !== "all") {
      filtered = filtered.filter(product => product.transportMode === transportFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "price":
          aValue = a.price
          bValue = b.price
          break
        case "inventory":
          aValue = a.inventory
          bValue = b.inventory
          break
        case "importCost":
          aValue = a.importCost || 0
          bValue = b.importCost || 0
          break
        case "warehouse":
          aValue = a.warehouse?.toLowerCase() || 'zzz'
          bValue = b.warehouse?.toLowerCase() || 'zzz'
          break
        case "created":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case "published":
          aValue = a.published ? 1 : 0
          bValue = b.published ? 1 : 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset à la première page après filtrage
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    }
    return sortOrder === "asc" ? 
      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : 
      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
  }

  const handleRefresh = async () => {
    await fetchProducts()
  }

  const handleEdit = (productId: string) => {
    window.location.href = `/admin/products/${productId}/edit`
  }

  const handleView = (productId: string) => {
    window.location.href = `/admin/products/${productId}`
  }

  const handleDelete = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit importé ?')) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          toast({
            title: "Produit supprimé",
            description: "Le produit importé a été supprimé avec succès"
          })
          fetchProducts()
        } else {
          throw new Error('Erreur lors de la suppression')
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le produit",
          variant: "destructive"
        })
      }
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    
    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + '...'
    }
    
    return truncated + '...'
  }

  const getWarehouseFlag = (warehouse: string) => {
    switch (warehouse?.toLowerCase()) {
      case 'france':
        return '🇫🇷'
      case 'usa':
        return '🇺🇸'
      case 'uk':
        return '🇬🇧'
      default:
        return '🌍'
    }
  }

  // Récupérer les entrepôts uniques pour le filtre
  const warehouses = Array.from(new Set(products.map(p => p.warehouse).filter(Boolean))) as string[]

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchProducts}
            variant="outline"
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="rounded-lg border">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full mb-4" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Produits Importés"
        count={filteredProducts.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <Link href="/admin/products/imported/simulation">
            <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Simulation d'import
            </Button>
          </Link>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="published">Publiés</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="featured">Mis en avant</SelectItem>
              <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={warehouseFilter}
            onValueChange={(value) => setWarehouseFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue placeholder="Entrepôt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les entrepôts</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse} value={warehouse.toLowerCase()}>
                  {getWarehouseFlag(warehouse)} {warehouse.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={transportFilter}
            onValueChange={(value) => setTransportFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue placeholder="Transport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les transports</SelectItem>
              <SelectItem value="air">
                <div className="flex items-center">
                  <Plane className="h-3 w-3 mr-2" />
                  Aérien
                </div>
              </SelectItem>
              <SelectItem value="sea">
                <div className="flex items-center">
                  <Ship className="h-3 w-3 mr-2" />
                  Maritime
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="rounded-lg border">
        <ResponsiveList
          gridChildren={
            paginatedProducts.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des produits importés...</div>
                  </div>
                ) : searchTerm || statusFilter !== "all" || warehouseFilter !== "all" || transportFilter !== "all" ? (
                  <>
                    Aucun produit importé ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setStatusFilter("all")
                        setWarehouseFilter("all")
                        setTransportFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucun produit importé disponible
                    <div className="text-xs mt-2">
                      Utilisez la simulation d'import pour créer des produits
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <ImportedProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
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
                <TableHead onClick={() => handleSort("warehouse")} className="cursor-pointer">
                  <div className="flex items-center">
                    Entrepôt {renderSortIcon("warehouse")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                  <div className="flex items-center">
                    Prix {renderSortIcon("price")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("importCost")} className="cursor-pointer">
                  <div className="flex items-center">
                    Coût d'import {renderSortIcon("importCost")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("inventory")} className="cursor-pointer">
                  <div className="flex items-center">
                    Stock {renderSortIcon("inventory")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("published")} className="cursor-pointer">
                  <div className="flex items-center">
                    Statut {renderSortIcon("published")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("created")} className="cursor-pointer">
                  <div className="flex items-center">
                    Date {renderSortIcon("created")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des produits importés...</div>
                      </div>
                    ) : searchTerm || statusFilter !== "all" || warehouseFilter !== "all" || transportFilter !== "all" ? (
                      <>
                        Aucun produit importé ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setStatusFilter("all")
                            setWarehouseFilter("all")
                            setTransportFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucun produit importé disponible
                        <div className="text-xs mt-2">
                          Utilisez la simulation d'import pour créer des produits
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50 group">
                    <TableCell>
                      <div className="flex items-center">
                        {product.images && product.images[0] ? (
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            <Image 
                              src={product.images[0].path} 
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{truncateText(product.name, 50)}</div>
                          <div className="text-sm text-gray-500">
                            {product.sku || 'Sans référence'}
                          </div>
                          {product.featured && (
                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <Tag className="h-3 w-3 mr-1" />
                              Mis en avant
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getWarehouseFlag(product.warehouse || '')}</span>
                        <div>
                          <div className="font-medium">{product.warehouse?.toUpperCase()}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {product.transportMode === 'air' ? (
                              <Plane className="h-3 w-3" />
                            ) : (
                              <Ship className="h-3 w-3" />
                            )}
                            {product.transportMode === 'air' ? 'Aérien' : 'Maritime'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        <PriceWithConversion price={product.price} />
                      </div>
                      {product.supplierPrice && product.supplierCurrency && (
                        <div className="text-xs text-gray-500">
                          Fournisseur: {product.supplierPrice} {product.supplierCurrency}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.importCost ? (
                        <div className="font-medium text-blue-900">
                          <PriceWithConversion price={product.importCost} />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.inventory > 10 
                          ? 'bg-green-100 text-green-800'
                          : product.inventory > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inventory} en stock
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.published ? "default" : "secondary"}
                      >
                        {product.published ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(product.createdAt)}
                      </div>
                      {product.transitTime && (
                        <div className="text-xs text-gray-400">
                          Délai: {product.transitTime}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(product.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveList>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits importés
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value))
                setCurrentPage(1)
              }}
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  if (totalPages <= 5) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }
                  
                  // Logique de pagination avancée pour plus de 5 pages
                  let pageNumber = page
                  if (currentPage > 3) {
                    pageNumber = currentPage - 2 + i
                  }
                  if (pageNumber > totalPages) return null
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  )
} 