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
  Filter
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
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { PageHeader } from '@/components/ui/page-header'

interface ProductCategory {
  id: string
  name: string
}

interface ProductImage {
  id: string
  path: string
  alt: string | null
}

interface ProductVariation {
  id: string
  sku: string | null
  price: number
  inventory: number
  attributes: Array<{
    id: string
    name: string
    value: string
  }>
}

interface Product {
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
  variations: ProductVariation[]
  totalInventory: number
}

type SortField = "name" | "price" | "inventory" | "category" | "created" | "published"
type SortOrder = "asc" | "desc"

function ProductCard({ product, onEdit, onDelete, onView }: {
  product: Product
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
                {product.barcode && (
                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {product.barcode}
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                onClick={() => onView(product.id)}
                title="Voir"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                onClick={() => onEdit(product.id)}
                title="Modifier"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={() => onDelete(product.id)}
                title="Supprimer"
              >
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Informations du produit */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">
                  <PriceWithConversion price={product.price} />
                </span>
                {product.compareAtPrice && product.compareAtPrice > 0 && (
                  <span className="text-sm text-gray-500 line-through ml-2">
                    <PriceWithConversion price={product.compareAtPrice} />
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
              <span>Stock: {product.totalInventory}</span>
              <span>{product.category?.name || 'Sans catégorie'}</span>
            </div>

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("created")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchProducts = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/products?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Erreur lors du chargement des produits')
      
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
      setError('Une erreur est survenue lors du chargement des produits')
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
  }, [searchTerm, sortField, sortOrder, statusFilter, categoryFilter, products])

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
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        filtered = filtered.filter(product => product.totalInventory <= 0)
      } else if (statusFilter === "low_stock") {
        filtered = filtered.filter(product => product.totalInventory > 0 && product.totalInventory <= 10)
      }
    }

    // Filtrage par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category?.id === categoryFilter)
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
          aValue = a.totalInventory
          bValue = b.totalInventory
          break
        case "category":
          aValue = a.category?.name?.toLowerCase() || 'zzz'
          bValue = b.category?.name?.toLowerCase() || 'zzz'
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          toast({
            title: "Produit supprimé",
            description: "Le produit a été supprimé avec succès"
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

  // Récupérer les catégories uniques pour le filtre
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

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
        title="Produits"
        count={filteredProducts.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <Link href="/admin/products/new">
            <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Nouveau produit
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
              <SelectItem value="low_stock">Stock faible</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.filter(category => category !== null).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
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
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des produits...</div>
                  </div>
                ) : searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                  <>
                    Aucun produit ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setStatusFilter("all")
                        setCategoryFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucun produit disponible
                    <div className="text-xs mt-2">
                      Créez un nouveau produit pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <ProductCard
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des produits...</div>
                      </div>
                    ) : searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                      <>
                        Aucun produit ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setStatusFilter("all")
                            setCategoryFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucun produit disponible
                        <div className="text-xs mt-2">
                          Créez un nouveau produit pour commencer
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
                          <div className="font-medium text-gray-900" title={product.name}>
                            {product.name.length > 50 ? product.name.substring(0, 50) + '...' : product.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{product.sku || 'Sans référence'}</span>
                            {product.barcode && (
                              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                {product.barcode}
                              </span>
                            )}
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category?.name || 'Sans catégorie'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          <PriceWithConversion price={product.price} />
                        </div>
                        {product.compareAtPrice && product.compareAtPrice > 0 && (
                          <div className="text-sm text-gray-500 line-through">
                            <PriceWithConversion price={product.compareAtPrice} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.totalInventory > 10 
                          ? 'bg-green-100 text-green-800'
                          : product.totalInventory > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.totalInventory} en stock
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                          onClick={() => handleView(product.id)}
                          title="Voir"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                          onClick={() => handleEdit(product.id)}
                          title="Modifier"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDelete(product.id)}
                          title="Supprimer"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits
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