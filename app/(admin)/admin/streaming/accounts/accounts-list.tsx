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
  Key,
  Clock,
  CreditCard,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { AccountCard } from '@/components/cards/account-card'
import { PageHeader } from '@/components/ui/page-header'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  hasGiftCards: boolean
  hasProfiles: boolean
}

interface ProviderOffer {
  id: string
  name: string
  price: number
  currency: string
}

interface ActiveSubscription {
  id: string
  status: string
  endDate: string
  user: {
    firstName: string | null
    lastName: string | null
    email: string
  }
}

interface Account {
  id: string
  username: string
  email: string | null
  status: string
  availability: boolean
  platform: Platform
  providerOffer?: ProviderOffer | null
  createdAt: Date
  expiresAt: Date | null
  activeSubscription?: ActiveSubscription | null
  accountProfiles: {
    id: string
    isAssigned: boolean
  }[]
}

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
}

type SortField = "username" | "platform" | "status" | "availability" | "profiles" | "expiresAt" | "createdAt"
type SortOrder = "asc" | "desc"

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("expiresAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  
  // Variables pour la recharge
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [selectedGiftCards, setSelectedGiftCards] = useState<GiftCard[]>([])
  const [isRecharging, setIsRecharging] = useState(false)

  const calculateDaysRemaining = (expiresAt: Date | null): number | null => {
    if (!expiresAt) return null
    const today = new Date()
    const expiration = new Date(expiresAt)
    const diffTime = expiration.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatCurrency = (amount: number, currency: string): string => {
    switch (currency) {
      case 'TRY':
        return `${amount} ₺`
      case 'EUR':
        return `${amount} €`
      case 'USD':
        return `${amount} $`
      case 'MGA':
        return `${amount} Ar`
      default:
        return `${amount} ${currency}`
    }
  }

  const calculateNewExpirationDate = (): Date | null => {
    if (!selectedAccount || selectedGiftCards.length === 0) return null
    
    if (!selectedAccount.providerOffer) {
      return null
    }
    
    const totalAmount = selectedGiftCards.reduce((sum, card) => sum + card.amount, 0)
    const totalDays = Math.floor((totalAmount / selectedAccount.providerOffer.price) * 30)
    
    const currentExpiration = selectedAccount.expiresAt 
      ? new Date(selectedAccount.expiresAt) 
      : new Date()
    
    const startDate = new Date(Math.max(currentExpiration.getTime(), new Date().getTime()))
    
    const newExpirationDate = new Date(startDate)
    newExpirationDate.setDate(newExpirationDate.getDate() + totalDays)
    
    return newExpirationDate
  }

  const handleGiftCardToggle = (card: GiftCard) => {
    setSelectedGiftCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      return isSelected
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
    })
  }

  const fetchAccounts = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/accounts?t=${timestamp}`, {
          cache: 'no-store'
        })
      
        if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du chargement des comptes')
        }
      
        const data = await response.json()
      console.log('Comptes récupérés:', data)
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setAccounts([])
        return
      }
      
        setAccounts(data)
      setFilteredAccounts(data)
      setError(null)
      } catch (err) {
      console.error('Erreur lors du chargement des comptes:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, platformFilter, availabilityFilter, accounts])

  const applyFiltersAndSort = () => {
    if (!accounts || accounts.length === 0) {
      setFilteredAccounts([])
      return
    }

    let filtered = [...accounts]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(account =>
        account.username.toLowerCase().includes(search) ||
        (account.email && account.email.toLowerCase().includes(search)) ||
        account.platform.name.toLowerCase().includes(search)
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(account => account.status === statusFilter)
    }

    // Filtre par plateforme
    if (platformFilter !== "all") {
      filtered = filtered.filter(account => account.platform.id === platformFilter)
    }

    // Filtre par disponibilité
    if (availabilityFilter !== "all") {
      if (availabilityFilter === "available") {
        filtered = filtered.filter(account => account.availability)
      } else if (availabilityFilter === "unavailable") {
        filtered = filtered.filter(account => !account.availability)
      }
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "username":
          aValue = a.username.toLowerCase()
          bValue = b.username.toLowerCase()
          break
        case "platform":
          aValue = a.platform.name.toLowerCase()
          bValue = b.platform.name.toLowerCase()
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "availability":
          aValue = a.availability ? 1 : 0
          bValue = b.availability ? 1 : 0
          break
        case "profiles":
          aValue = a.accountProfiles.filter(p => p.isAssigned).length
          bValue = b.accountProfiles.filter(p => p.isAssigned).length
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
          aValue = a.username.toLowerCase()
          bValue = b.username.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredAccounts(filtered)
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
    await fetchAccounts()
  }

  const fetchGiftCards = async (platformId: string) => {
    try {
      const response = await fetch(`/api/admin/streaming/gift-cards?platformId=${platformId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des cartes cadeaux')
      const data = await response.json()
      setGiftCards(data)
    } catch (err) {
      console.error('Erreur lors du chargement des cartes cadeaux:', err)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les cartes cadeaux'
      })
    }
  }

  const handleRecharge = async (account: Account) => {
    setSelectedAccount(account)
    setSelectedGiftCards([])
    setRechargeDialogOpen(true)
    await fetchGiftCards(account.platform.id)
  }

  const handleConfirmRecharge = async () => {
    if (!selectedAccount || selectedGiftCards.length === 0) return

    try {
      setIsRecharging(true)
      const response = await fetch(`/api/admin/streaming/accounts/${selectedAccount.id}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftCardIds: selectedGiftCards.map(card => card.id) })
      })

      if (!response.ok) throw new Error('Erreur lors de la recharge')

      toast({
        title: 'Recharge effectuée',
        description: 'Le compte a été rechargé avec succès'
      })

      setRechargeDialogOpen(false)
      await fetchAccounts()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la recharge du compte'
      })
    } finally {
      setIsRecharging(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    setSelectedAccountId(accountId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedAccountId) return

    try {
      setIsActionLoading(selectedAccountId)
      const response = await fetch(`/api/admin/streaming/accounts/${selectedAccountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setAccounts(prev => prev.filter(a => a.id !== selectedAccountId))
      toast({
        title: 'Succès',
        description: 'Compte supprimé avec succès'
      })
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression du compte'
      })
    } finally {
      setIsActionLoading(null)
      setDeleteDialogOpen(false)
      setSelectedAccountId(null)
    }
  }

  // Récupérer les plateformes uniques pour le filtre
  const uniquePlatforms = Array.from(
    new Map(accounts.map(account => [account.platform.id, account.platform])).values()
  )

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage)

  const getDaysRemainingBadge = (daysRemaining: number | null) => {
    if (daysRemaining === null) return null
    
    if (daysRemaining > 30) {
      return <Badge variant="success">{daysRemaining} jours</Badge>
    } else if (daysRemaining > 7) {
      return <Badge variant="warning">{daysRemaining} jours</Badge>
    } else if (daysRemaining > 0) {
      return <Badge variant="destructive">{daysRemaining} jours</Badge>
    } else {
      return <Badge variant="secondary">Expiré</Badge>
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchAccounts}
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
          title="Comptes de streaming"
          count={filteredAccounts.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={clearSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          actions={
            <Link href="/admin/streaming/accounts/add">
              <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Nouveau compte
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
              <SelectItem value="INACTIVE">Inactifs</SelectItem>
              <SelectItem value="SUSPENDED">Suspendus</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={availabilityFilter}
            onValueChange={(value) => setAvailabilityFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Disponibilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="unavailable">Non disponibles</SelectItem>
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

        <div className="rounded-lg border">
          <ResponsiveList
            gridChildren={
              paginatedAccounts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="text-sm">Chargement des comptes...</div>
                    </div>
                  ) : searchTerm || statusFilter !== "all" || platformFilter !== "all" || availabilityFilter !== "all" ? (
                    <>
                      Aucun compte ne correspond à vos critères
                      <Button
                        variant="link"
                        onClick={() => {
                          clearSearch()
                          setStatusFilter("all")
                          setPlatformFilter("all")
                          setAvailabilityFilter("all")
                        }}
                        className="ml-2"
                      >
                        Réinitialiser les filtres
                      </Button>
                    </>
                  ) : (
                    <>
                      Aucun compte disponible
                      <div className="text-xs mt-2">
                        Créez un nouveau compte pour commencer
                      </div>
                    </>
                        )}
                      </div>
              ) : (
                paginatedAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDelete={handleDelete}
                    onRecharge={handleRecharge}
                    isActionLoading={isActionLoading}
                    calculateDaysRemaining={calculateDaysRemaining}
                  />
                ))
              )
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("username")} className="cursor-pointer">
                    <div className="flex items-center">
                      Compte {renderSortIcon("username")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("platform")} className="cursor-pointer">
                    <div className="flex items-center">
                      Plateforme {renderSortIcon("platform")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="flex items-center">
                      Statut {renderSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("expiresAt")} className="cursor-pointer">
                    <div className="flex items-center">
                      Jours restants {renderSortIcon("expiresAt")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("availability")} className="cursor-pointer">
                    <div className="flex items-center">
                      Disponibilité {renderSortIcon("availability")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("profiles")} className="cursor-pointer">
                    <div className="flex items-center">
                      Profils {renderSortIcon("profiles")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                    <div className="flex items-center">
                      Date d'expiration {renderSortIcon("createdAt")}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Skeleton className="h-8 w-32" />
                          <div className="text-sm">Chargement des comptes...</div>
                        </div>
                      ) : searchTerm || statusFilter !== "all" || platformFilter !== "all" || availabilityFilter !== "all" ? (
                        <>
                          Aucun compte ne correspond à vos critères
                          <Button
                            variant="link"
                            onClick={() => {
                              clearSearch()
                              setStatusFilter("all")
                              setPlatformFilter("all")
                              setAvailabilityFilter("all")
                            }}
                            className="ml-2"
                          >
                            Réinitialiser les filtres
                          </Button>
                        </>
                      ) : (
                        <>
                          Aucun compte disponible
                          <div className="text-xs mt-2">
                            Créez un nouveau compte pour commencer
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAccounts.map((account) => (
                    <TableRow key={account.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <Key className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">{account.username}</div>
                            {account.email && (
                              <div className="text-sm text-muted-foreground">{account.email}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center mr-2">
                      {account.platform.logo ? (
                        <img 
                          src={account.platform.logo} 
                          alt={account.platform.name}
                                className="h-full w-full object-contain"
                        />
                      ) : (
                              <Globe className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{account.platform.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          account.status === 'ACTIVE' ? 'success' :
                          account.status === 'INACTIVE' ? 'secondary' :
                          account.status === 'SUSPENDED' ? 'destructive' :
                        'outline'
                      }>
                          {account.status === 'ACTIVE' ? 'Actif' :
                           account.status === 'INACTIVE' ? 'Inactif' :
                           account.status === 'SUSPENDED' ? 'Suspendu' : account.status}
                      </Badge>
                      </TableCell>
                      <TableCell>
                        {getDaysRemainingBadge(calculateDaysRemaining(account.expiresAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant={account.availability ? 'success' : 'secondary'}>
                            {account.availability ? (
                              <Check className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <XIcon className="h-3.5 w-3.5 mr-1" />
                            )}
                            {account.availability ? 'Disponible' : 'Non disponible'}
                          </Badge>
                          {!account.availability && account.activeSubscription && !account.platform.hasProfiles && (
                            <div className="text-xs text-orange-600 mt-1">
                              Utilisé par {account.activeSubscription.user.firstName || account.activeSubscription.user.lastName 
                                ? `${account.activeSubscription.user.firstName || ''} ${account.activeSubscription.user.lastName || ''}`.trim()
                                : account.activeSubscription.user.email
                              }
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {account.accountProfiles.filter(p => p.isAssigned).length}/{account.accountProfiles.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>
                            {account.expiresAt ? formatDate(account.expiresAt) : 'Pas d\'expiration'}
                          </span>
                    </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {account.platform.hasGiftCards && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRecharge(account)}
                              className="hover:bg-gray-100"
                              title="Recharger le compte"
                            >
                              <RefreshCw className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="hover:bg-gray-100"
                        title="Voir les détails"
                      >
                            <Link href={`/admin/streaming/accounts/${account.id}`}>
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
                            <Link href={`/admin/streaming/accounts/${account.id}/edit`}>
                              <Pencil className="h-4 w-4 text-gray-700" />
                      </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(account.id)}
                            className="hover:bg-gray-100"
                            disabled={isActionLoading === account.id}
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
              Affichage de {filteredAccounts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} sur {filteredAccounts.length} comptes
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

      {/* Dialog de recharge */}
      <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recharger le compte</DialogTitle>
            <DialogDescription>
              Sélectionnez les cartes cadeaux à utiliser pour recharger ce compte.
            </DialogDescription>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Informations du compte</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Compte :</strong> {selectedAccount.username}</div>
                  <div><strong>Plateforme :</strong> {selectedAccount.platform.name}</div>
                  <div><strong>Expire le :</strong> {selectedAccount.expiresAt ? formatDate(selectedAccount.expiresAt) : 'Pas d\'expiration'}</div>
                  <div><strong>Jours restants :</strong> {calculateDaysRemaining(selectedAccount.expiresAt) || 0} jours</div>
                </div>
              </div>

              {!selectedAccount.providerOffer ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">
                    Aucune offre fournisseur associée à ce compte. Veuillez d'abord associer une offre pour pouvoir calculer la recharge.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium">Cartes cadeaux disponibles</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {giftCards.filter(card => card.status === 'ACTIVE').map((card) => (
                        <div
                          key={card.id}
                          onClick={() => handleGiftCardToggle(card)}
                          className={`
                            cursor-pointer p-3 rounded-lg border-2 transition-all
                            ${selectedGiftCards.some(c => c.id === card.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {formatCurrency(card.amount, card.currency)}
                              </div>
                              <div className="text-sm text-gray-600">
                                Code: {card.code}
                              </div>
                            </div>
                            <div
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center
                                ${selectedGiftCards.some(c => c.id === card.id)
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300'
                                }
                              `}
                            >
                              {selectedGiftCards.some(c => c.id === card.id) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Résumé de la sélection */}
                  {selectedGiftCards.length > 0 && selectedAccount?.providerOffer && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-3">
                      <h4 className="text-sm font-medium text-blue-900">Résumé de la recharge</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Offre du compte :</span>
                          <span className="font-medium">{selectedAccount.providerOffer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Prix mensuel :</span>
                          <span className="font-medium">{formatCurrency(selectedAccount.providerOffer.price, selectedAccount.providerOffer.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Cartes sélectionnées :</span>
                          <span className="font-medium">{selectedGiftCards.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Montant total :</span>
                          <span className="font-medium">
                            {formatCurrency(
                              selectedGiftCards.reduce((sum, card) => sum + card.amount, 0),
                              selectedGiftCards[0]?.currency || selectedAccount.providerOffer.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Jours ajoutés :</span>
                          <span className="font-medium">
                            {Math.floor((selectedGiftCards.reduce((sum, card) => sum + card.amount, 0) / selectedAccount.providerOffer.price) * 30)} jours
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-blue-200 pt-2">
                          <span className="text-blue-700 font-medium">Nouvelle date d'expiration :</span>
                          <span className="font-medium text-blue-900">
                            {calculateNewExpirationDate()?.toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) || 'Erreur de calcul'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
    </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmRecharge} 
              disabled={selectedGiftCards.length === 0 || isRecharging || !selectedAccount?.providerOffer}
            >
              {isRecharging ? 'Recharge en cours...' : 'Confirmer la recharge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isActionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading === selectedAccountId ? (
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