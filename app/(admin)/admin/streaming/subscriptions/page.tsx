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
  User, 
  Eye, 
  Pencil, 
  Search,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  Filter,
  Plus,
  AlertCircle,
  RefreshCw,
  Calendar,
  CreditCard,
  MoreHorizontal,
  CheckCircle2,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
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
import { PriceDisplay } from '@/components/ui/price-display'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { SubscriptionCard } from '@/components/cards/subscription-card'
import { PageHeader } from '@/components/ui/page-header'

interface Platform {
  id: string
  name: string
  logo: string | null
  hasProfiles?: boolean
  maxProfilesPerAccount?: number
}

interface Account {
  id: string
  username: string | null
  email: string | null
}

interface AccountWithPlatform extends Account {
  platform: Platform
}

interface AccountProfile {
  id: string
  name: string | null
  profileSlot: number
  accountId: string
}

interface Subscription {
  id: string
  startDate: string
  endDate: string
  status: string
  autoRenew: boolean
  contactNeeded: boolean
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  offer: {
    id: string
    name: string
    price: number
    duration: number
    durationUnit?: string
  }
  platformOffer?: {
    platform: Platform
  }
  subscriptionAccounts: {
    account: AccountWithPlatform
  }[]
  accountProfiles: AccountProfile[]
}

type SortField = "client" | "offer" | "account" | "period" | "remainingDays" | "status"
type SortOrder = "asc" | "desc"

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("remainingDays")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // Ajout d'un timestamp pour éviter la mise en cache par le navigateur
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/subscriptions?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Erreur lors du chargement des abonnements')
      
      const data = await response.json()
      console.log('Abonnements récupérés:', data)
      
      // Vérifier si les données sont valides
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setSubscriptions([])
        return
      }
      
      setSubscriptions(data)
      setFilteredSubscriptions(data) // Définir directement sans filtrer
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des abonnements')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Chargement initial des abonnements uniquement au montage du composant
  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Filtrage et tri des abonnements
  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, subscriptions])

  const applyFiltersAndSort = () => {
    if (!subscriptions || subscriptions.length === 0) {
      setFilteredSubscriptions([])
      return
    }

    let filtered = [...subscriptions]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(sub => 
        sub.user.email.toLowerCase().includes(search) ||
        (sub.user.firstName && sub.user.firstName.toLowerCase().includes(search)) ||
        (sub.user.lastName && sub.user.lastName.toLowerCase().includes(search)) ||
        sub.offer.name.toLowerCase().includes(search) ||
        (sub.platformOffer?.platform.name.toLowerCase().includes(search)) ||
        sub.subscriptionAccounts.some(sa => 
          sa.account.email?.toLowerCase().includes(search) || 
          sa.account.username?.toLowerCase().includes(search)
        )
      )
    }
    
    // Filtre par statut
    if (statusFilter === 'incomplete') {
      filtered = filtered.filter(sub => 
        sub.subscriptionAccounts.length === 0 || 
        (sub.platformOffer?.platform && sub.subscriptionAccounts.some(
          sa => sa.account.platform.id !== sub.platformOffer!.platform.id
        ))
      )
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'client':
          comparison = (a.user.lastName || '').localeCompare(b.user.lastName || '')
          break
        case 'offer':
          comparison = a.offer.name.localeCompare(b.offer.name)
          break
        case 'account':
          const aAccount = a.subscriptionAccounts[0]?.account.username || ''
          const bAccount = b.subscriptionAccounts[0]?.account.username || ''
          comparison = aAccount.localeCompare(bAccount)
          break
        case 'period':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          break
        case 'remainingDays':
          const today = new Date()
          const aEndDate = new Date(a.endDate)
          const bEndDate = new Date(b.endDate)
          const aDays = Math.ceil((aEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const bDays = Math.ceil((bEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          comparison = aDays - bDays
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredSubscriptions(filtered)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
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
    if (sortField !== field) return null
    return sortOrder === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />
  }

  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = async () => {
    await fetchSubscriptions()
  }

  const handleStatusChange = async (subscriptionId: string, newStatus: string, contactNeeded: boolean = false) => {
    try {
      setIsActionLoading(subscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          contactNeeded
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Mettre à jour la liste des abonnements sans recharger toute la page
      const updatedSubscriptions = subscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return { ...sub, status: newStatus, contactNeeded }
        }
        return sub
      })
      
      setSubscriptions(updatedSubscriptions)
      setFilteredSubscriptions(prevFiltered => {
        return prevFiltered.map(sub => {
          if (sub.id === subscriptionId) {
            return { ...sub, status: newStatus, contactNeeded }
          }
          return sub
        })
      })

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'abonnement a été mis à jour.',
        duration: 3000,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleClientContacted = async (subscriptionId: string) => {
    try {
      setIsActionLoading(subscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactNeeded: false,
          status: 'ACTIVE'
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Mettre à jour la liste des abonnements sans recharger toute la page
      const updatedSubscriptions = subscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return { ...sub, status: 'ACTIVE', contactNeeded: false }
        }
        return sub
      })
      
      setSubscriptions(updatedSubscriptions)
      setFilteredSubscriptions(prevFiltered => {
        return prevFiltered.map(sub => {
          if (sub.id === subscriptionId) {
            return { ...sub, status: 'ACTIVE', contactNeeded: false }
          }
          return sub
        })
      })

      toast({
        title: 'Client contacté',
        description: 'Le client a été marqué comme contacté.',
        duration: 3000,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleRenewSubscription = async (subscriptionId: string) => {
    try {
      setIsActionLoading(subscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscriptionId}/renew`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors du renouvellement')
      }

      toast({
        title: 'Abonnement renouvelé',
        description: 'L\'abonnement a été renouvelé avec succès.',
        duration: 3000,
      })

      await fetchSubscriptions()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors du renouvellement.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
      setRenewDialogOpen(false)
      setSelectedSubscriptionId(null)
    }
  }

  const openRenewDialog = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId)
    setRenewDialogOpen(true)
  }

  const handleDelete = async (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedSubscriptionId) return

    try {
      setIsActionLoading(selectedSubscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${selectedSubscriptionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast({
        title: 'Abonnement supprimé',
        description: 'L\'abonnement a été supprimé avec succès.',
        duration: 3000,
      })

      await fetchSubscriptions()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedSubscriptionId(null)
    }
  }

  const calculateRemainingDays = (endDate: string): number => {
    const endDateTime = new Date(endDate);
    const today = new Date();
    const diffTime = endDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50'
      case 'PENDING':
        return 'bg-yellow-50'
      case 'EXPIRED':
        return 'bg-red-50'
      case 'CANCELLED':
        return 'bg-gray-50'
      case 'CONTACT_NEEDED':
        return 'bg-orange-50'
      default:
        return ''
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchSubscriptions}
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
        title="Abonnements"
        count={filteredSubscriptions.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <Link href="/admin/streaming/subscriptions/add">
            <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Nouvel abonnement
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
            <SelectItem value="ACTIVE">Actifs</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="EXPIRED">Expirés</SelectItem>
            <SelectItem value="CANCELLED">Annulés</SelectItem>
            <SelectItem value="incomplete">⚠️ Incomplets</SelectItem>
            <SelectItem value="platform_mismatch">⚠️ Plateforme incohérente</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="rounded-lg border">
        <ResponsiveList
          gridChildren={
            paginatedSubscriptions.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des abonnements...</div>
                  </div>
                ) : searchTerm || statusFilter !== "all" ? (
                  <>
                    Aucun abonnement ne correspond à vos critères
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
                    Aucun abonnement disponible
                    <div className="text-xs mt-2">
                      Créez un nouvel abonnement pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onStatusChange={handleStatusChange}
                  onClientContacted={handleClientContacted}
                  onRenew={openRenewDialog}
                  onDelete={handleDelete}
                  isActionLoading={isActionLoading}
                  calculateRemainingDays={calculateRemainingDays}
                  getStatusColor={getStatusColor}
                />
              ))
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead onClick={() => handleSort("client")} className="cursor-pointer">
                    <div className="flex items-center">
                      Client {renderSortIcon("client")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("offer")} className="cursor-pointer">
                    <div className="flex items-center">
                      Offre & Plateforme {renderSortIcon("offer")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("account")} className="cursor-pointer">
                    <div className="flex items-center">
                      Compte & Profils {renderSortIcon("account")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("period")} className="cursor-pointer">
                    <div className="flex items-center">
                      Période {renderSortIcon("period")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("remainingDays")} className="cursor-pointer">
                    <div className="flex items-center">
                      Jours restants {renderSortIcon("remainingDays")}
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
                {paginatedSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Skeleton className="h-8 w-32" />
                          <div className="text-sm">Chargement des abonnements...</div>
                        </div>
                      ) : searchTerm || statusFilter !== "all" ? (
                      <>
                        Aucun abonnement ne correspond à vos critères
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
                          Aucun abonnement disponible
                          <div className="text-xs mt-2">
                            Créez un nouvel abonnement pour commencer
                          </div>
                        </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                  paginatedSubscriptions.map((subscription) => (
                    <TableRow 
                      key={subscription.id}
                      className={getStatusColor(subscription.status)}
                    >
                    <TableCell>
                        <div className="font-medium">
                          {subscription.user.firstName} {subscription.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user.email}
                      </div>
                    </TableCell>
                      <TableCell>
                        <div className="flex items-start">
                          <div className="flex-1">
                          <div className="font-medium">{subscription.offer.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-1">
                              <PriceDisplay price={subscription.offer.price} size="small" />
                              <span>/</span>
                              <span>{subscription.offer.duration} {subscription.offer.durationUnit?.toLowerCase() || 'jours'}</span>
                          </div>
                          </div>
                          {subscription.platformOffer?.platform ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center space-x-2">
                                {subscription.platformOffer.platform.logo && (
                                  <img 
                                    src={subscription.platformOffer.platform.logo}
                                    alt={subscription.platformOffer.platform.name}
                                    className="w-6 h-6 rounded"
                                  />
                                )}
                                <span className="font-medium">{subscription.platformOffer.platform.name}</span>
                              </div>
                              {subscription.platformOffer.platform.hasProfiles && (
                                <div className="text-xs text-muted-foreground">
                                  {subscription.platformOffer.platform.maxProfilesPerAccount} profils max
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex-shrink-0">
                              {/* Plateforme non spécifiée, mais n'affichons rien */}
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                        {subscription.subscriptionAccounts.length > 0 ? (
                          <div className="space-y-3">
                            {subscription.subscriptionAccounts.map((sa, index) => {
                              // Vérifier si la plateforme du compte correspond à celle de l'offre
                              const isPlatformMismatch = subscription.platformOffer?.platform &&
                                sa.account.platform.id !== subscription.platformOffer.platform.id;
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`border-l-2 pl-2 py-1 ${isPlatformMismatch ? 'border-red-400' : 'border-blue-400'}`}
                                >
                                  <div className="flex items-center space-x-1">
                                    <User className={`h-4 w-4 ${isPlatformMismatch ? 'text-red-500' : 'text-blue-500'}`} />
                                    <Link 
                                      href={`/admin/streaming/accounts/${sa.account.id}`}
                                      className="hover:underline font-medium"
                                    >
                                      {sa.account.username || sa.account.email || 'Compte sans nom'}
                                    </Link>
                                    <span className={`text-xs rounded-full px-2 py-0.5 ml-2 ${
                                      isPlatformMismatch 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {sa.account.platform.name}
                                    </span>
                                    
                                    {isPlatformMismatch && (
                                      <span className="text-xs bg-red-100 text-red-800 rounded px-1 ml-1 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Plateforme incorrecte
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Profils associés à ce compte spécifique */}
                                  {subscription.accountProfiles.length > 0 && 
                                   subscription.accountProfiles.filter(p => p.accountId === sa.account.id).length > 0 ? (
                                    <div className="ml-4 mt-1">
                                      <div className="text-xs text-muted-foreground mb-1">Profils:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {subscription.accountProfiles
                                          .filter(p => p.accountId === sa.account.id)
                                          .map((profile, idx) => (
                                            <div 
                                              key={idx} 
                                              className={`flex items-center text-xs rounded-full px-2 py-1 ${
                                                isPlatformMismatch 
                                                  ? 'bg-red-50' 
                                                  : 'bg-gray-100'
                                              }`}
                                              title={`Slot ${profile.profileSlot}`}
                                            >
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 text-[10px] ${
                                                isPlatformMismatch 
                                                  ? 'bg-red-200' 
                                                  : 'bg-gray-300'
                                              }`}>
                                                {profile.profileSlot}
                                              </span>
                                              <span>{profile.name || `Profil ${profile.profileSlot}`}</span>
                                            </div>
                                          ))
                                        }
                                      </div>
                                    </div>
                                  ) : (
                                    sa.account.platform.hasProfiles && (
                                      <div className="ml-4 mt-1 text-xs text-muted-foreground italic">
                                        Aucun profil assigné
                                      </div>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>Aucun compte associé</span>
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 rounded px-1">Obligatoire</span>
                      </div>
                        )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>{formatDate(subscription.startDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Calendar className="h-3 w-3 text-red-500" />
                          <span>{formatDate(subscription.endDate)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const remainingDays = calculateRemainingDays(subscription.endDate);
                        return (
                          <div className={`text-sm ${remainingDays <= 7 ? 'text-red-500 font-medium' : ''}`}>
                            {remainingDays > 0 ? `${remainingDays} jours` : 'Expiré'}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={subscription.status}
                        onValueChange={(value) => handleStatusChange(subscription.id, value)}
                        disabled={isActionLoading === subscription.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <Badge
                              variant={
                                subscription.status === 'ACTIVE' ? 'success' :
                                subscription.status === 'PENDING' ? 'warning' :
                                subscription.status === 'EXPIRED' ? 'destructive' :
                                subscription.status === 'CANCELLED' ? 'outline' :
                                subscription.status === 'CONTACT_NEEDED' ? 'warning' :
                                'default'
                              }
                            >
                              {subscription.status === 'ACTIVE' ? 'Actif' :
                               subscription.status === 'PENDING' ? 'En attente' :
                               subscription.status === 'EXPIRED' ? 'Expiré' :
                               subscription.status === 'CANCELLED' ? 'Annulé' :
                               subscription.status === 'CONTACT_NEEDED' ? 'Contact requis' :
                               subscription.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <Badge variant="success">Actif</Badge>
                          </SelectItem>
                          <SelectItem value="PENDING">
                            <Badge variant="warning">En attente</Badge>
                          </SelectItem>
                          <SelectItem value="EXPIRED">
                            <Badge variant="destructive">Expiré</Badge>
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            <Badge variant="outline">Annulé</Badge>
                          </SelectItem>
                          <SelectItem value="CONTACT_NEEDED">
                            <Badge variant="warning">Contact requis</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(subscription.status === 'CONTACT_NEEDED' || 
                          subscription.status === 'EXPIRED' || 
                          subscription.status === 'CANCELLED') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRenewDialog(subscription.id)}
                            disabled={isActionLoading === subscription.id}
                            className="hover:bg-gray-100"
                            title="Renouveler l'abonnement"
                          >
                            <Calendar className="h-4 w-4 text-gray-700" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="hover:bg-gray-100"
                          title="Voir les détails"
                        >
                          <Link href={`/admin/streaming/subscriptions/${subscription.id}`}>
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
                          <Link href={`/admin/streaming/subscriptions/${subscription.id}/edit`}>
                            <Pencil className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(subscription.id)}
                          className="hover:bg-gray-100"
                          disabled={isActionLoading === subscription.id}
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
      </div>

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
              Affichage de {filteredSubscriptions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} sur {filteredSubscriptions.length} abonnements
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

      <AlertDialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renouveler cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va créer un nouvel abonnement en utilisant les mêmes paramètres 
              (offre, comptes, profils) que l'abonnement actuel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSubscriptionId && handleRenewSubscription(selectedSubscriptionId)}
              disabled={isActionLoading !== null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isActionLoading === selectedSubscriptionId ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Renouveler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'abonnement sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedSubscriptionId ? (
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
 
 
 