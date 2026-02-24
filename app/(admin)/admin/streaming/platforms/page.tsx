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
  Globe, 
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
  Users,
  Trash2,
  Check
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
import { useRouter } from 'next/navigation'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { PlatformCard } from '@/components/cards/platform-card'
import { PageHeader } from '@/components/ui/page-header'

interface Platform {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  hasMultipleOffers?: boolean
  hasGiftCards?: boolean
}

type SortField = "name" | "type" | "profiles" | "status" | "createdAt"
type SortOrder = "asc" | "desc"

export default function PlatformsPage() {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)

  const fetchPlatforms = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/platforms?t=${timestamp}`, {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push('/login')
            return
          }
        throw new Error('Erreur lors du chargement des plateformes')
        }
        
        const data = await response.json()
      console.log('Plateformes récupérées:', data)
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setPlatforms([])
        return
      }
      
        setPlatforms(data)
      setFilteredPlatforms(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des plateformes')
      } finally {
        setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    fetchPlatforms()
  }, [fetchPlatforms])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, typeFilter, statusFilter, platforms])

  const applyFiltersAndSort = () => {
    if (!platforms || platforms.length === 0) {
      setFilteredPlatforms([])
      return
    }

    let filtered = [...platforms]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(platform =>
        platform.name.toLowerCase().includes(search) ||
        platform.slug.toLowerCase().includes(search) ||
        platform.type.toLowerCase().includes(search) ||
        (platform.description && platform.description.toLowerCase().includes(search))
      )
    }

    // Filtre par type
    if (typeFilter !== "all") {
      filtered = filtered.filter(platform => platform.type === typeFilter)
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(platform => platform.isActive)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(platform => !platform.isActive)
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
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "profiles":
          aValue = a.hasProfiles ? (a.maxProfilesPerAccount || 999) : 0
          bValue = b.hasProfiles ? (b.maxProfilesPerAccount || 999) : 0
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

    setFilteredPlatforms(filtered)
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
    await fetchPlatforms()
  }

  const handleDelete = async (platformId: string) => {
    setSelectedPlatformId(platformId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedPlatformId) return

    try {
      setIsActionLoading(selectedPlatformId)
      const response = await fetch(`/api/admin/streaming/platforms/${selectedPlatformId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'FOREIGN_KEY_CONSTRAINT') {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de supprimer cette plateforme car elle est utilisée par des comptes ou des cartes cadeaux'
          })
          return
        }
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setPlatforms(prev => prev.filter(p => p.id !== selectedPlatformId))
      toast({
        title: 'Succès',
        description: 'Plateforme supprimée avec succès'
      })
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression de la plateforme'
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedPlatformId(null)
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredPlatforms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPlatforms = filteredPlatforms.slice(startIndex, startIndex + itemsPerPage)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchPlatforms}
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
          title="Plateformes de streaming"
          count={filteredPlatforms.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={clearSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          actions={
            <Link href="/admin/streaming/platforms/add">
              <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Nouvelle plateforme
              </Button>
            </Link>
          }
        >
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="VIDEO">Vidéo</SelectItem>
              <SelectItem value="AUDIO">Audio</SelectItem>
              <SelectItem value="GAMING">Jeux</SelectItem>
            </SelectContent>
          </Select>

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
            paginatedPlatforms.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des plateformes...</div>
                  </div>
                ) : searchTerm || typeFilter !== "all" || statusFilter !== "all" ? (
                  <>
                    Aucune plateforme ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setTypeFilter("all")
                        setStatusFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucune plateforme disponible
                    <div className="text-xs mt-2">
                      Créez une nouvelle plateforme pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedPlatforms.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
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
                    Plateforme {renderSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                  <div className="flex items-center">
                    Type {renderSortIcon("type")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("profiles")} className="cursor-pointer">
                  <div className="flex items-center">
                    Profils {renderSortIcon("profiles")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  <div className="flex items-center">
                    Statut {renderSortIcon("status")}
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
              {paginatedPlatforms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des plateformes...</div>
                      </div>
                    ) : searchTerm || typeFilter !== "all" || statusFilter !== "all" ? (
                      <>
                        Aucune plateforme ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setTypeFilter("all")
                            setStatusFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucune plateforme disponible
                        <div className="text-xs mt-2">
                          Créez une nouvelle plateforme pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlatforms.map((platform) => (
                  <TableRow key={platform.id} className="hover:bg-gray-50">
                    <TableCell>
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mr-3">
                        {platform.logo ? (
                          <img 
                            src={platform.logo} 
                            alt={platform.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Globe className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-muted-foreground">{platform.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                    <Badge variant={
                      platform.type === 'VIDEO' ? 'default' :
                      platform.type === 'AUDIO' ? 'secondary' :
                      platform.type === 'GAMING' ? 'destructive' :
                      'outline'
                    }>
                        {platform.type === 'VIDEO' ? 'Vidéo' :
                         platform.type === 'AUDIO' ? 'Audio' :
                         platform.type === 'GAMING' ? 'Jeux' : platform.type}
                    </Badge>
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                        {platform.hasProfiles ? (
                          platform.maxProfilesPerAccount ? 
                            `${platform.maxProfilesPerAccount} max` : 
                            'Illimité'
                        ) : (
                          'Non supporté'
                        )}
                      </span>
                    </div>
                    </TableCell>
                    <TableCell>
                    <Badge variant={platform.isActive ? 'success' : 'secondary'}>
                      {platform.isActive ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 mr-1" />
                      )}
                      {platform.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{formatDate(platform.createdAt)}</span>
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
                          <Link href={`/admin/streaming/platforms/${platform.id}`}>
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
                          <Link href={`/admin/streaming/platforms/edit/${platform.id}`}>
                            <Pencil className="h-4 w-4 text-gray-700" />
                      </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(platform.id)}
                          className="hover:bg-gray-100"
                          disabled={isActionLoading === platform.id}
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
              Affichage de {filteredPlatforms.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredPlatforms.length)} sur {filteredPlatforms.length} plateformes
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
            <AlertDialogTitle>Supprimer cette plateforme ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La plateforme sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedPlatformId ? (
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
