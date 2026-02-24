'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Eye, 
  Pencil, 
  Search,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  Filter,
  Plus,
  RefreshCw,
  Calendar,
  Trash2,
  Image as ImageIcon,
  Folder,
  FolderOpen,
  Hash
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/use-toast'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { CategoryCard } from '@/components/cards/category-card'
import { PageHeader } from '@/components/ui/page-header'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  image: string | null
  parent: {
    id: string
    name: string
  } | null
  children: {
    id: string
    name: string
  }[]
  _count: {
    services: number
    products: number
  }
}

type SortField = "name" | "parent" | "services" | "products"
type SortOrder = "asc" | "desc"

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [parentFilter, setParentFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/categories?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories')
      }
      
      const data = await response.json()
      console.log('Catégories récupérées:', data)
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setCategories([])
        return
      }
      
      setCategories(data)
      setFilteredCategories(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des catégories')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, parentFilter, categories])

  const applyFiltersAndSort = () => {
    if (!categories || categories.length === 0) {
      setFilteredCategories([])
      return
    }

    let filtered = [...categories]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(search) ||
        (category.description && category.description.toLowerCase().includes(search)) ||
        (category.parent && category.parent.name.toLowerCase().includes(search))
      )
    }

    // Filtre par parent
    if (parentFilter !== "all") {
      if (parentFilter === "root") {
        filtered = filtered.filter(category => !category.parentId)
      } else if (parentFilter === "child") {
        filtered = filtered.filter(category => category.parentId)
      } else {
        filtered = filtered.filter(category => category.parentId === parentFilter)
      }
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "parent":
          aValue = a.parent?.name.toLowerCase() || ""
          bValue = b.parent?.name.toLowerCase() || ""
          break
        case "services":
          aValue = a._count.services
          bValue = b._count.services
          break
        case "products":
          aValue = a._count.products
          bValue = b._count.products
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredCategories(filtered)
    setCurrentPage(1)
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
      return <ChevronUp className="h-4 w-4 opacity-30" />
    }
    return sortOrder === "asc" ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = async () => {
    await fetchCategories()
  }

  const handleDelete = async (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCategoryId) return

    try {
      setIsActionLoading(selectedCategoryId)
      const response = await fetch(`/api/admin/categories/${selectedCategoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setCategories(prev => prev.filter(c => c.id !== selectedCategoryId))
      toast({
        title: 'Succès',
        description: 'Catégorie supprimée avec succès'
      })
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression de la catégorie'
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedCategoryId(null)
    }
  }

  // Récupérer les catégories parentes pour le filtre
  const parentCategories = categories.filter(cat => !cat.parentId)

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchCategories}
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
    <>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Catégories de services"
          count={filteredCategories.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={clearSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          actions={
            <div className="flex items-center space-x-2">
              <Link href="/admin/services">
                <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                  Retour aux services
                </Button>
              </Link>
              <Link href="/admin/services/categories/add">
                <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Nouvelle catégorie
                </Button>
              </Link>
            </div>
          }
        >
          <Select
            value={parentFilter}
            onValueChange={(value) => setParentFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="root">Catégories principales</SelectItem>
              <SelectItem value="child">Sous-catégories</SelectItem>
              {parentCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  Enfants de {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PageHeader>

        <ResponsiveList
          gridChildren={
            paginatedCategories.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des catégories...</div>
                  </div>
                ) : searchTerm || parentFilter !== "all" ? (
                  <>
                    Aucune catégorie ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setParentFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucune catégorie disponible
                    <div className="text-xs mt-2">
                      Créez une nouvelle catégorie pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onDelete={handleDelete}
                  isActionLoading={isActionLoading}
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
                    Catégorie {renderSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("parent")} className="cursor-pointer">
                  <div className="flex items-center">
                    Parent {renderSortIcon("parent")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("services")} className="cursor-pointer">
                  <div className="flex items-center">
                    Services {renderSortIcon("services")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("products")} className="cursor-pointer">
                  <div className="flex items-center">
                    Produits {renderSortIcon("products")}
                  </div>
                </TableHead>
                <TableHead>Sous-catégories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des catégories...</div>
                      </div>
                    ) : searchTerm || parentFilter !== "all" ? (
                      <>
                        Aucune catégorie ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setParentFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucune catégorie disponible
                        <div className="text-xs mt-2">
                          Créez une nouvelle catégorie pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mr-3">
                          {category.image ? (
                            <Image 
                              src={category.image} 
                              alt={category.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <Folder className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.parent ? (
                        <div className="flex items-center">
                          <FolderOpen className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm">{category.parent.name}</span>
                        </div>
                      ) : (
                        <Badge variant="outline">Principale</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="font-medium">{category._count.services}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="font-medium">{category._count.products}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm">{category.children.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="hover:bg-gray-100"
                          title="Voir les détails"
                        >
                          <Link href={`/admin/services/categories/${category.id}`}>
                            <Eye className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="hover:bg-gray-100"
                          title="Modifier"
                        >
                          <Link href={`/admin/services/categories/${category.id}/edit`}>
                            <Pencil className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          className="hover:bg-gray-100"
                          disabled={isActionLoading === category.id}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-gray-700" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveList>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value))
                setCurrentPage(1)
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
              Affichage de {filteredCategories.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredCategories.length)} sur {filteredCategories.length} catégories
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
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La catégorie sera définitivement supprimée.
              Tous les services et produits associés perdront leur catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedCategoryId ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}