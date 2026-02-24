'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
  User,
  ChevronUp,
  ChevronDown,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Briefcase,
  ShoppingBag,
  Play
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

interface Client {
  id: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  image?: string | null
  customerType?: string
  companyName?: string | null
  communicationMethod?: string | null
  facebookPage?: string | null
  whatsappNumber?: string | null
  telegramUsername?: string | null
  addresses: any[]
  orders: any[]
  subscriptions: any[]
  totalSpent: number
}

type SortField = "name" | "email" | "type" | "orders" | "subscriptions" | "totalSpent"
type SortOrder = "asc" | "desc"

function ClientCard({ client, onEdit, onDelete, onView }: {
  client: Client
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
}) {
  const getDisplayName = (client: Client) => {
    if (client.firstName && client.lastName) {
      return `${client.firstName} ${client.lastName}`
    }
    return client.name || client.email || client.phone || 'Sans nom'
  }

  const getInitials = (client: Client) => {
    return client.firstName?.charAt(0) || 
           client.email?.charAt(0)?.toUpperCase() || 
           client.phone?.charAt(0) || 
           'C'
  }

  const getCommunicationIcon = (method: string | null | undefined) => {
    switch (method) {
      case 'EMAIL': return <Mail className="h-3.5 w-3.5" />
      case 'WHATSAPP': return <MessageCircle className="h-3.5 w-3.5" />
      case 'SMS': return <MessageSquare className="h-3.5 w-3.5" />
      case 'FACEBOOK': return <MessageSquare className="h-3.5 w-3.5" />
      case 'TELEGRAM': return <Send className="h-3.5 w-3.5" />
      default: return null
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          {client.image ? (
            <img 
              src={client.image} 
              alt={getDisplayName(client)}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover"
            />
          ) : (
            <span className="text-lg sm:text-xl font-medium text-gray-600">
              {getInitials(client)}
            </span>
          )}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                {getDisplayName(client)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={client.customerType === 'BUSINESS' ? 'default' : 'secondary'} className="text-xs">
                  {client.customerType === 'BUSINESS' ? (
                    <><Briefcase className="h-3 w-3 mr-1" />Entreprise</>
                  ) : (
                    <><User className="h-3 w-3 mr-1" />Particulier</>
                  )}
                </Badge>
                {client.communicationMethod && (
                  <div className="flex items-center text-xs text-gray-500">
                    {getCommunicationIcon(client.communicationMethod)}
                    <span className="ml-1">{client.communicationMethod}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                onClick={() => onView(client.id)}
                title="Voir"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                onClick={() => onEdit(client.id)}
                title="Modifier"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={() => onDelete(client.id)}
                title="Supprimer"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Informations du client */}
          <div className="mt-2 space-y-1">
            {client.email && (
              <div className="flex items-center text-xs text-gray-500">
                <Mail className="h-3 w-3 mr-1" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center text-xs text-gray-500">
                <Phone className="h-3 w-3 mr-1" />
                <span>{client.phone}</span>
              </div>
            )}

            {client.companyName && (
              <div className="flex items-center text-xs text-gray-500">
                <Briefcase className="h-3 w-3 mr-1" />
                <span className="truncate">{client.companyName}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <div className="flex items-center">
                <ShoppingBag className="h-3 w-3 mr-1" />
                <span>{client.orders?.length || 0} commandes</span>
              </div>
              <div className="flex items-center">
                <Play className="h-3 w-3 mr-1" />
                <span>{client.subscriptions?.length || 0} abonnements</span>
              </div>
            </div>

            <div className="text-xs font-medium text-gray-900 mt-1">
                              Total dépensé: <PriceWithConversion price={client.totalSpent || 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [communicationFilter, setCommunicationFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchClients = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/clients?t=${timestamp}`, {
        cache: 'no-store',
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Erreur lors du chargement des clients')
      
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setClients([])
        return
      }
      
      setClients(data)
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des clients')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, typeFilter, communicationFilter, clients])

  const applyFiltersAndSort = () => {
    if (!clients || clients.length === 0) {
      setFilteredClients([])
      return
    }

    let filtered = [...clients]

    // Filtrage par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(client => {
        const name = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name || ''
        const email = client.email || ''
        const phone = client.phone || ''
        const company = client.companyName || ''
        
        return name.toLowerCase().includes(term) ||
               email.toLowerCase().includes(term) ||
               phone.includes(term) ||
               company.toLowerCase().includes(term)
      })
    }

    // Filtrage par type
    if (typeFilter !== "all") {
      filtered = filtered.filter(client => client.customerType === typeFilter)
    }

    // Filtrage par moyen de communication
    if (communicationFilter !== "all") {
      filtered = filtered.filter(client => client.communicationMethod === communicationFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "name":
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.name || a.email || ''
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.name || b.email || ''
          break
        case "email":
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case "type":
          aValue = a.customerType || ''
          bValue = b.customerType || ''
          break
        case "orders":
          aValue = a.orders?.length || 0
          bValue = b.orders?.length || 0
          break
        case "subscriptions":
          aValue = a.subscriptions?.length || 0
          bValue = b.subscriptions?.length || 0
          break
        case "totalSpent":
          aValue = a.totalSpent || 0
          bValue = b.totalSpent || 0
          break
        default:
          aValue = ''
          bValue = ''
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredClients(filtered)
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
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
    }
    return sortOrder === "asc" ? 
      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : 
      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
  }

  const handleRefresh = async () => {
    await fetchClients()
  }

  const handleEdit = (clientId: string) => {
    window.location.href = `/admin/clients/${clientId}/edit`
  }

  const handleView = (clientId: string) => {
    window.location.href = `/admin/clients/${clientId}`
  }

  const handleDelete = async (clientId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        const response = await fetch(`/api/admin/clients/${clientId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          toast({
            title: "Client supprimé",
            description: "Le client a été supprimé avec succès"
          })
          fetchClients()
        } else {
          throw new Error('Erreur lors de la suppression')
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le client",
          variant: "destructive"
        })
      }
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  const getDisplayName = (client: Client) => {
    if (client.firstName && client.lastName) {
      return `${client.firstName} ${client.lastName}`
    }
    return client.name || client.email || client.phone || 'Sans nom'
  }

  const getInitials = (client: Client) => {
    return client.firstName?.charAt(0) || 
           client.email?.charAt(0)?.toUpperCase() || 
           client.phone?.charAt(0) || 
           'C'
  }

  const getCommunicationIcon = (method: string | null | undefined) => {
    switch (method) {
      case 'EMAIL': return <Mail className="h-3.5 w-3.5" />
      case 'WHATSAPP': return <MessageCircle className="h-3.5 w-3.5" />
      case 'SMS': return <MessageSquare className="h-3.5 w-3.5" />
      case 'FACEBOOK': return <MessageSquare className="h-3.5 w-3.5" />
      case 'TELEGRAM': return <Send className="h-3.5 w-3.5" />
      default: return null
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchClients}
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
        title="Clients"
        count={filteredClients.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <Link href="/admin/clients/new">
            <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Nouveau client
            </Button>
          </Link>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="INDIVIDUAL">Particuliers</SelectItem>
              <SelectItem value="BUSINESS">Entreprises</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={communicationFilter}
            onValueChange={(value) => setCommunicationFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-7 sm:h-8 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Communication" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="TELEGRAM">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="rounded-lg border">
        <ResponsiveList
          gridChildren={
            paginatedClients.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-sm">Chargement des clients...</div>
                  </div>
                ) : searchTerm || typeFilter !== "all" || communicationFilter !== "all" ? (
                  <>
                    Aucun client ne correspond à vos critères
                    <Button
                      variant="link"
                      onClick={() => {
                        clearSearch()
                        setTypeFilter("all")
                        setCommunicationFilter("all")
                      }}
                      className="ml-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    Aucun client disponible
                    <div className="text-xs mt-2">
                      Créez un nouveau client pour commencer
                    </div>
                  </>
                )}
              </div>
            ) : (
              paginatedClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
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
                    Client {renderSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                  <div className="flex items-center">
                    Type {renderSortIcon("type")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                  <div className="flex items-center">
                    Contact {renderSortIcon("email")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("orders")} className="cursor-pointer">
                  <div className="flex items-center">
                    Commandes {renderSortIcon("orders")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("subscriptions")} className="cursor-pointer">
                  <div className="flex items-center">
                    Abonnements {renderSortIcon("subscriptions")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("totalSpent")} className="cursor-pointer">
                  <div className="flex items-center">
                    Total dépensé {renderSortIcon("totalSpent")}
                  </div>
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des clients...</div>
                      </div>
                    ) : searchTerm || typeFilter !== "all" || communicationFilter !== "all" ? (
                      <>
                        Aucun client ne correspond à vos critères
                        <Button
                          variant="link"
                          onClick={() => {
                            clearSearch()
                            setTypeFilter("all")
                            setCommunicationFilter("all")
                          }}
                          className="ml-2"
                        >
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        Aucun client disponible
                        <div className="text-xs mt-2">
                          Créez un nouveau client pour commencer
                        </div>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50 group">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {client.image ? (
                            <img 
                              src={client.image} 
                              alt={getDisplayName(client)}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {getInitials(client)}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {getDisplayName(client)}
                          </div>
                          {client.companyName && (
                            <div className="text-sm text-gray-500">{client.companyName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.customerType === 'BUSINESS' ? 'default' : 'secondary'}>
                        {client.customerType === 'BUSINESS' ? (
                          <><Briefcase className="h-3 w-3 mr-1" />Entreprise</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" />Particulier</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                        {client.communicationMethod && (
                          <div className="flex items-center text-xs text-blue-600">
                            {getCommunicationIcon(client.communicationMethod)}
                            <span className="ml-1">{client.communicationMethod}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {client.orders?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Play className="h-3 w-3 mr-1" />
                        {client.subscriptions?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        <PriceWithConversion price={client.totalSpent || 0} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          onClick={() => handleView(client.id)}
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                          onClick={() => handleEdit(client.id)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDelete(client.id)}
                          title="Supprimer"
                        >
                          <Trash className="h-4 w-4" />
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
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
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