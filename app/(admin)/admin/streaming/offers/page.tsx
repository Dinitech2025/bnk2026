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
  Tag,
  Clock,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
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
import { PriceDisplay } from '@/components/ui/price-display'
import Image from 'next/image'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { OfferCard } from '@/components/cards/offer-card'
import { PageHeader } from '@/components/ui/page-header'

interface Platform {
  id: string
  name: string
  logo: string | null
}

interface PlatformConfig {
  id: string
  platformId: string
  profileCount: number
  isDefault: boolean
  platform?: Platform
}

interface Offer {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  durationUnit: string
  isActive: boolean
  images: string[]
  platformConfigs: PlatformConfig[]
  createdAt: Date
  updatedAt: Date
}

type SortField = "name" | "price" | "duration" | "platformCount" | "status" | "createdAt"
type SortOrder = "asc" | "desc"

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)

  const fetchOffers = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/offers?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des offres')
      }
      
      const data = await response.json()
      console.log('Offres récupérées:', data)
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setOffers([])
        return
      }
      
      setOffers(data)
      setFilteredOffers(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des offres')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, offers])

  const applyFiltersAndSort = () => {
    if (!offers || offers.length === 0) {
      setFilteredOffers([])
      return
    }

    let filtered = [...offers]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(offer =>
        offer.name.toLowerCase().includes(search) ||
        (offer.description && offer.description.toLowerCase().includes(search))
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(offer => offer.isActive)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(offer => !offer.isActive)
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
        case "price":
          aValue = a.price
          bValue = b.price
          break
        case "duration":
          aValue = a.duration * getDurationMultiplier(a.durationUnit)
          bValue = b.duration * getDurationMultiplier(b.durationUnit)
          break
        case "platformCount":
          aValue = a.platformConfigs.length
          bValue = b.platformConfigs.length
          break
        case "status":
          aValue = a.isActive ? 1 : 0
          bValue = b.isActive ? 1 : 0
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredOffers(filtered)
    setCurrentPage(1)
  }

  function getDurationMultiplier(unit: string): number {
    switch (unit) {
      case 'DAY': return 1
      case 'WEEK': return 7
      case 'MONTH': return 30
      case 'YEAR': return 365
      default: return 1
    }
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
    await fetchOffers()
  }

  const handleDelete = async (offerId: string) => {
    setSelectedOfferId(offerId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedOfferId) return

    try {
      setIsActionLoading(selectedOfferId)
      const response = await fetch(`/api/admin/streaming/offers/${selectedOfferId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setOffers(prev => prev.filter(o => o.id !== selectedOfferId))
      toast({
        title: 'Succès',
        description: 'Offre supprimée avec succès'
      })
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression de l\'offre'
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedOfferId(null)
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + itemsPerPage)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchOffers}
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
          title="Offres de streaming"
          count={filteredOffers.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={clearSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          actions={
            <Link href="/admin/streaming/offers/add">
              <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Nouvelle offre
              </Button>
            </Link>
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
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="inactive">Inactives</SelectItem>
            </SelectContent>
          </Select>
        </PageHeader>

        <ResponsiveList
          gridChildren={
            paginatedOffers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des offres...</div>
                  </div>
                ) : searchTerm || statusFilter !== "all" ? (
                  <>
                    Aucune offre ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setStatusFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucune offre disponible
                    <div className="text-xs mt-2">
                      Créez une nouvelle offre pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
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
                    Offre {renderSortIcon("name")}
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
                <TableHead onClick={() => handleSort("platformCount")} className="cursor-pointer">
                  <div className="flex items-center">
                    Plateformes {renderSortIcon("platformCount")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  <div className="flex items-center">
                    Statut {renderSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des offres...</div>
                      </div>
                    ) : searchTerm || statusFilter !== "all" ? (
                      <>
                        Aucune offre ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setStatusFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucune offre disponible
                        <div className="text-xs mt-2">
                          Créez une nouvelle offre pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOffers.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          {offer.images && offer.images.length > 0 ? (
                            <Image
                              src={offer.images[0]}
                              alt={offer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="text-xs font-medium text-gray-600">
                              {offer.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{offer.name}</div>
                          {offer.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                              {offer.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-green-600" />
                        <PriceDisplay price={offer.price} size="small" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm">{formatDuration(offer.duration, offer.durationUnit)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {offer.platformConfigs.slice(0, 2).map(config => (
                          <Badge
                            key={config.id}
                            variant={config.isDefault ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {config.platform?.name || 'Plateforme'} ({config.profileCount})
                          </Badge>
                        ))}
                        {offer.platformConfigs.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.platformConfigs.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={offer.isActive ? 'success' : 'secondary'}>
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
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
                          <Link href={`/admin/streaming/offers/${offer.id}`}>
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
                          <Link href={`/admin/streaming/offers/${offer.id}/edit`}>
                            <Pencil className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(offer.id)}
                          className="hover:bg-gray-100"
                          disabled={isActionLoading === offer.id}
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
              Affichage de {filteredOffers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredOffers.length)} sur {filteredOffers.length} offres
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
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'offre sera définitivement supprimée et peut affecter les abonnements existants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedOfferId ? (
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
