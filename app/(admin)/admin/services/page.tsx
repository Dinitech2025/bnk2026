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
  Clock,
  DollarSign,
  Trash2,
  Image as ImageIcon,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatPrice } from '@/lib/utils'
import { PriceWithConversion } from '@/components/ui/currency-selector'
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
import { ServiceCard } from '@/components/cards/service-card'
import { PageHeader } from '@/components/ui/page-header'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
}

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  duration: number
  published: boolean
  category: Category | null
  images: {
    id: string
    path: string
    alt: string | null
  }[]
  pricingType?: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED'
}

type SortField = "name" | "category" | "price" | "duration" | "published"
type SortOrder = "asc" | "desc"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/services?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des services')
      }
      
      const data = await response.json()
      console.log('Services récupérés:', data)
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setServices([])
        return
      }
      
      setServices(data)
      setFilteredServices(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des services')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, categoryFilter, services])

  const applyFiltersAndSort = () => {
    if (!services || services.length === 0) {
      setFilteredServices([])
      return
    }

    let filtered = [...services]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(search) ||
        (service.description && service.description.toLowerCase().includes(search)) ||
        (service.category && service.category.name.toLowerCase().includes(search))
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      if (statusFilter === "published") {
        filtered = filtered.filter(service => service.published)
      } else if (statusFilter === "draft") {
        filtered = filtered.filter(service => !service.published)
      }
    }

    // Filtre par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => service.category?.id === categoryFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "category":
          aValue = a.category?.name.toLowerCase() || ""
          bValue = b.category?.name.toLowerCase() || ""
          break
        case "price":
          aValue = a.price
          bValue = b.price
          break
        case "duration":
          aValue = a.duration
          bValue = b.duration
          break
        case "published":
          aValue = a.published ? 1 : 0
          bValue = b.published ? 1 : 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredServices(filtered)
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
    await fetchServices()
  }

  const handleDelete = async (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedServiceId) return

    try {
      setIsActionLoading(selectedServiceId)
      const response = await fetch(`/api/admin/services/${selectedServiceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setServices(prev => prev.filter(s => s.id !== selectedServiceId))
      toast({
        title: 'Succès',
        description: 'Service supprimé avec succès'
      })
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression du service'
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedServiceId(null)
    }
  }

  const getStatusBadge = (published: boolean) => {
    return published ? (
      <Badge variant="success">Publié</Badge>
    ) : (
      <Badge variant="secondary">Brouillon</Badge>
    )
  }

  // Récupérer les catégories uniques pour le filtre
  const uniqueCategories = Array.from(
    new Map(services.filter(s => s.category).map(service => [service.category!.id, service.category!])).values()
  )

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchServices}
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
          title="Services"
          count={filteredServices.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={clearSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          actions={
            <div className="flex items-center space-x-2">
              <Link href="/admin/services/categories">
                <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Catégories
                </Button>
              </Link>
              <Link href="/admin/services/add">
                <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Nouveau service
                </Button>
              </Link>
            </div>
          }
        >
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
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PageHeader>

        <ResponsiveList
          gridChildren={
            paginatedServices.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des services...</div>
                  </div>
                ) : searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                  <>
                    Aucun service ne correspond à vos critères
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
                    Aucun service disponible
                    <div className="text-xs mt-2">
                      Créez un nouveau service pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
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
                    Service {renderSortIcon("name")}
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
                <TableHead onClick={() => handleSort("duration")} className="cursor-pointer">
                  <div className="flex items-center">
                    Durée {renderSortIcon("duration")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("published")} className="cursor-pointer">
                  <div className="flex items-center">
                    Statut {renderSortIcon("published")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des services...</div>
                      </div>
                    ) : searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                      <>
                        Aucun service ne correspond à vos critères
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
                        Aucun service disponible
                        <div className="text-xs mt-2">
                          Créez un nouveau service pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServices.map((service) => (
                  <TableRow key={service.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mr-3">
                          {service.images[0]?.path ? (
                            <Image 
                              src={service.images[0].path} 
                              alt={service.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm">{service.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        {service.pricingType === 'QUOTE_REQUIRED' ? (
                          <span className="font-medium text-orange-600">Sur devis</span>
                        ) : (
                          <span className="font-medium"><PriceWithConversion price={Number(service.price)} /></span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm">{service.duration} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(service.published)}
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
                          <Link href={`/admin/services/${service.id}`}>
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
                          <Link href={`/admin/services/${service.id}/edit`}>
                            <Pencil className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                          className="hover:bg-gray-100"
                          disabled={isActionLoading === service.id}
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
              Affichage de {filteredServices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredServices.length)} sur {filteredServices.length} services
            </p>
          </div>

          <div className="flex items-center justify-center space-x-1">
            <PaginationPrevious 
              onClick={currentPage === 1 ? undefined : () => handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationLink
                key={page}
                onClick={() => handlePageChange(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            ))}
            
            <PaginationNext
              onClick={currentPage === totalPages ? undefined : () => handlePageChange(currentPage + 1)}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le service sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedServiceId ? (
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