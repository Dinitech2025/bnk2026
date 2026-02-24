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
  CreditCard,
  User,
  Trash2,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatPrice } from '@/lib/utils'
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
import { GiftCardCard } from '@/components/cards/gift-card-card'
import { PageHeader } from '@/components/ui/page-header'

interface Platform {
  id: string
  name: string
  logo: string | null
}

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
  platform: Platform
  usedBy: {
    email: string
  } | null
  usedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

type SortField = "code" | "platform" | "amount" | "status" | "expiresAt" | "createdAt"
type SortOrder = "asc" | "desc"

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [filteredGiftCards, setFilteredGiftCards] = useState<GiftCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGiftCardId, setSelectedGiftCardId] = useState<string | null>(null)

  const fetchGiftCards = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/gift-cards?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des cartes cadeaux')
      }
      
      const data = await response.json()
      console.log('Cartes cadeaux récupérées:', data)
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setGiftCards([])
        return
      }
      
      setGiftCards(data)
      setFilteredGiftCards(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des cartes cadeaux')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchGiftCards()
  }, [fetchGiftCards])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, platformFilter, giftCards])

  const applyFiltersAndSort = () => {
    if (!giftCards || giftCards.length === 0) {
      setFilteredGiftCards([])
      return
    }

    let filtered = [...giftCards]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(card =>
        card.code.toLowerCase().includes(search) ||
        card.platform.name.toLowerCase().includes(search) ||
        (card.usedBy && card.usedBy.email.toLowerCase().includes(search))
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(card => card.status === statusFilter)
    }

    // Filtre par plateforme
    if (platformFilter !== "all") {
      filtered = filtered.filter(card => card.platform.id === platformFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "code":
          aValue = a.code.toLowerCase()
          bValue = b.code.toLowerCase()
          break
        case "platform":
          aValue = a.platform.name.toLowerCase()
          bValue = b.platform.name.toLowerCase()
          break
        case "amount":
          aValue = a.amount
          bValue = b.amount
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "expiresAt":
          aValue = a.expiresAt ? new Date(a.expiresAt).getTime() : 0
          bValue = b.expiresAt ? new Date(b.expiresAt).getTime() : 0
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = a.code.toLowerCase()
          bValue = b.code.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredGiftCards(filtered)
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
    await fetchGiftCards()
  }

  const handleDelete = async (giftCardId: string) => {
    setSelectedGiftCardId(giftCardId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedGiftCardId) return

    try {
      setIsActionLoading(selectedGiftCardId)
      const response = await fetch(`/api/admin/streaming/gift-cards/${selectedGiftCardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setGiftCards(prev => prev.filter(g => g.id !== selectedGiftCardId))
      toast({
        title: 'Succès',
        description: 'Carte cadeau supprimée avec succès'
      })
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression de la carte cadeau'
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedGiftCardId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Actif</Badge>
      case 'USED':
        return <Badge variant="secondary">Utilisé</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expiré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Récupérer les plateformes uniques pour le filtre
  const uniquePlatforms = Array.from(
    new Map(giftCards.map(card => [card.platform.id, card.platform])).values()
  )

  // Pagination
  const totalPages = Math.ceil(filteredGiftCards.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGiftCards = filteredGiftCards.slice(startIndex, startIndex + itemsPerPage)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchGiftCards}
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
          title="Cartes cadeaux"
          count={filteredGiftCards.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={clearSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          actions={
            <Link href="/admin/streaming/gift-cards/new">
              <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Nouvelle carte
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
              <SelectItem value="ACTIVE">Actives</SelectItem>
              <SelectItem value="USED">Utilisées</SelectItem>
              <SelectItem value="EXPIRED">Expirées</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={platformFilter}
            onValueChange={(value) => setPlatformFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[220px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Plateforme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les plateformes</SelectItem>
              {uniquePlatforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PageHeader>

        <ResponsiveList
          gridChildren={
            paginatedGiftCards.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des cartes cadeaux...</div>
                  </div>
                ) : searchTerm || statusFilter !== "all" || platformFilter !== "all" ? (
                  <>
                    Aucune carte cadeau ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setStatusFilter("all")
                        setPlatformFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucune carte cadeau disponible
                    <div className="text-xs mt-2">
                      Créez une nouvelle carte cadeau pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedGiftCards.map((card) => (
                <GiftCardCard
                  key={card.id}
                  giftCard={card}
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
                <TableHead onClick={() => handleSort("code")} className="cursor-pointer">
                  <div className="flex items-center">
                    Code {renderSortIcon("code")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("platform")} className="cursor-pointer">
                  <div className="flex items-center">
                    Plateforme {renderSortIcon("platform")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("amount")} className="cursor-pointer">
                  <div className="flex items-center">
                    Montant {renderSortIcon("amount")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  <div className="flex items-center">
                    Statut {renderSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead>Utilisé par</TableHead>
                <TableHead onClick={() => handleSort("expiresAt")} className="cursor-pointer">
                  <div className="flex items-center">
                    Date d'expiration {renderSortIcon("expiresAt")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                  <div className="flex items-center">
                    Date de création {renderSortIcon("createdAt")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGiftCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des cartes cadeaux...</div>
                      </div>
                    ) : searchTerm || statusFilter !== "all" || platformFilter !== "all" ? (
                      <>
                        Aucune carte cadeau ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setStatusFilter("all")
                            setPlatformFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucune carte cadeau disponible
                        <div className="text-xs mt-2">
                          Créez une nouvelle carte cadeau pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGiftCards.map((card) => (
                  <TableRow key={card.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{card.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center mr-2">
                          {card.platform.logo ? (
                            <img 
                              src={card.platform.logo} 
                              alt={card.platform.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Globe className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{card.platform.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatPrice(card.amount, card.currency)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(card.status)}
                    </TableCell>
                    <TableCell>
                      {card.usedBy ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm">{card.usedBy.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>
                          {card.expiresAt ? formatDate(card.expiresAt) : 'Non définie'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{formatDate(card.createdAt)}</span>
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
                          <Link href={`/admin/streaming/gift-cards/${card.id}`}>
                            <Eye className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(card.id)}
                          className="hover:bg-gray-100"
                          disabled={isActionLoading === card.id}
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
              Affichage de {filteredGiftCards.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredGiftCards.length)} sur {filteredGiftCards.length} cartes cadeaux
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
            <AlertDialogTitle>Supprimer cette carte cadeau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La carte cadeau sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedGiftCardId ? (
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