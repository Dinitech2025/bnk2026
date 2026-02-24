'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  RefreshCw, 
  Search,
  Filter,
  Calendar,
  User,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  priority: string
  status: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  assignedTo: {
    id: string
    name: string | null
    email: string | null
  } | null
  relatedUser: {
    id: string
    name: string | null
    email: string | null
  } | null
}

const TASK_TYPES = {
  SUBSCRIPTION_EXPIRY: 'Expiration abonnement',
  ACCOUNT_RECHARGE: 'Recharge compte',
  PAYMENT_REMINDER: 'Rappel paiement',
  PROSPECTION: 'Prospection',
  REMOVE_CLIENT: 'Retrait client',
  CUSTOM: 'Personnalisée',
}

const TASK_PRIORITIES = {
  LOW: { label: 'Basse', color: 'bg-gray-500' },
  MEDIUM: { label: 'Moyenne', color: 'bg-blue-500' },
  HIGH: { label: 'Haute', color: 'bg-orange-500' },
  URGENT: { label: 'Urgente', color: 'bg-red-500' },
}

const TASK_STATUSES = {
  PENDING: { label: 'En attente', color: 'bg-yellow-500' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-500' },
  COMPLETED: { label: 'Terminée', color: 'bg-green-500' },
  CANCELLED: { label: 'Annulée', color: 'bg-gray-500' },
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
  })

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.type && filters.type !== 'all') params.append('type', filters.type)
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority)

      const response = await fetch(`/api/admin/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      } else {
        toast.error('Erreur lors du chargement des tâches')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des tâches')
    } finally {
      setIsLoading(false)
    }
  }

  const generateAutomaticTasks = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch('/api/admin/tasks/generate', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.totalCreated} tâches créées automatiquement`)
        fetchTasks()
      } else {
        toast.error('Erreur lors de la génération des tâches')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la génération des tâches')
    } finally {
      setIsGenerating(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Statut mis à jour')
        fetchTasks()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [filters.status, filters.type, filters.priority])

  const filteredTasks = tasks.filter(task => {
    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase()
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.relatedUser?.name?.toLowerCase().includes(searchLower) ||
      task.relatedUser?.email?.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    urgent: tasks.filter(t => t.priority === 'URGENT' && t.status !== 'COMPLETED').length,
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Tâches</h1>
          <p className="text-muted-foreground">
            Gérez les tâches et actions à effectuer
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateAutomaticTasks}
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Générer tâches auto
              </>
            )}
          </Button>
          <Button onClick={() => router.push('/admin/tasks/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(TASK_STATUSES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(TASK_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                {Object.entries(TASK_PRIORITIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tâches */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune tâche trouvée
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/tasks/${task.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={TASK_PRIORITIES[task.priority as keyof typeof TASK_PRIORITIES].color}>
                          {TASK_PRIORITIES[task.priority as keyof typeof TASK_PRIORITIES].label}
                        </Badge>
                        <Badge className={TASK_STATUSES[task.status as keyof typeof TASK_STATUSES].color}>
                          {TASK_STATUSES[task.status as keyof typeof TASK_STATUSES].label}
                        </Badge>
                        <Badge variant="outline">
                          {TASK_TYPES[task.type as keyof typeof TASK_TYPES]}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        )}
                        {task.relatedUser && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {task.relatedUser.name || task.relatedUser.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {task.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateTaskStatus(task.id, 'IN_PROGRESS')
                          }}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Démarrer
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateTaskStatus(task.id, 'COMPLETED')
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Terminer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

