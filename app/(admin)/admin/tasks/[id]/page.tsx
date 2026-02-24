'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  User,
  Calendar,
  AlertCircle,
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
  notes: string | null
  createdAt: string
  updatedAt: string
  assignedTo: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
  } | null
  relatedUser: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
  } | null
  relatedSubscription: {
    id: string
    startDate: string
    endDate: string
    status: string
    offer: {
      id: string
      name: string
    }
  } | null
  relatedAccount: {
    id: string
    username: string
    email: string | null
    expiresAt: string | null
    status: string
    platform: {
      id: string
      name: string
      logo: string | null
    }
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

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [editedTask, setEditedTask] = useState({
    status: '',
    priority: '',
    notes: '',
  })

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const fetchTask = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTask(data)
        setEditedTask({
          status: data.status,
          priority: data.priority,
          notes: data.notes || '',
        })
      } else {
        toast.error('Tâche non trouvée')
        router.push('/admin/tasks')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement de la tâche')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTask),
      })

      if (response.ok) {
        toast.success('Tâche mise à jour')
        fetchTask()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Tâche supprimée')
        router.push('/admin/tasks')
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleQuickAction = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Statut mis à jour')
        fetchTask()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tâche non trouvée</h2>
          <Button onClick={() => router.push('/admin/tasks')}>
            Retour aux tâches
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/tasks')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">
              Créée le {format(new Date(task.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {task.status === 'PENDING' && (
            <Button
              variant="outline"
              onClick={() => handleQuickAction('IN_PROGRESS')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Démarrer
            </Button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <Button
              variant="outline"
              onClick={() => handleQuickAction('COMPLETED')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Terminer
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || 'Aucune description'}
              </p>
            </CardContent>
          </Card>

          {/* Informations liées */}
          {(task.relatedUser || task.relatedSubscription || task.relatedAccount) && (
            <Card>
              <CardHeader>
                <CardTitle>Informations liées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.relatedUser && (
                  <div>
                    <Label className="text-sm font-semibold">Client concerné</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">
                        {task.relatedUser.name || `${task.relatedUser.firstName} ${task.relatedUser.lastName}`}
                      </p>
                      {task.relatedUser.email && (
                        <p className="text-sm text-muted-foreground">{task.relatedUser.email}</p>
                      )}
                      {task.relatedUser.phone && (
                        <p className="text-sm text-muted-foreground">{task.relatedUser.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {task.relatedSubscription && (
                  <div>
                    <Label className="text-sm font-semibold">Abonnement concerné</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">{task.relatedSubscription.offer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Du {format(new Date(task.relatedSubscription.startDate), 'dd/MM/yyyy', { locale: fr })} au{' '}
                        {format(new Date(task.relatedSubscription.endDate), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {task.relatedSubscription.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {task.relatedAccount && (
                  <div>
                    <Label className="text-sm font-semibold">Compte concerné</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">
                        {task.relatedAccount.platform.name} - {task.relatedAccount.username}
                      </p>
                      {task.relatedAccount.email && (
                        <p className="text-sm text-muted-foreground">{task.relatedAccount.email}</p>
                      )}
                      {task.relatedAccount.expiresAt && (
                        <p className="text-sm text-muted-foreground">
                          Expire le {format(new Date(task.relatedAccount.expiresAt), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-1">
                        {task.relatedAccount.status}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Ajoutez des notes internes sur cette tâche
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedTask.notes}
                onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                placeholder="Ajoutez vos notes ici..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Modifier la tâche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Statut</Label>
                <Select
                  value={editedTask.status}
                  onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUSES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priorité</Label>
                <Select
                  value={editedTask.priority}
                  onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Échéance</p>
                    <p className="text-muted-foreground">
                      {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Assignée à</p>
                    <p className="text-muted-foreground">
                      {task.assignedTo.name || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                    </p>
                  </div>
                </div>
              )}

              {task.createdBy && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Créée par</p>
                    <p className="text-muted-foreground">
                      {task.createdBy.name || `${task.createdBy.firstName} ${task.createdBy.lastName}`}
                    </p>
                  </div>
                </div>
              )}

              {task.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">Complétée le</p>
                    <p className="text-muted-foreground">
                      {format(new Date(task.completedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Dernière modification : {format(new Date(task.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

