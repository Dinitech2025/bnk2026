'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreHorizontal, Loader2, RefreshCw } from 'lucide-react'

interface SubscriptionActionsProps {
  subscription: {
    id: string
    status: string
    autoRenew: boolean
    contactNeeded: boolean
    endDate: string
  }
}

export function SubscriptionActions({ subscription }: SubscriptionActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function onDelete() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscription.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast({
        title: 'Abonnement supprimé',
        description: 'L\'abonnement a été supprimé avec succès.',
      })

      router.push('/admin/streaming/subscriptions')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression.',
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  async function onStatusChange(newStatus: string) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'abonnement a été mis à jour.',
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onAutoRenewToggle() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoRenew: !subscription.autoRenew,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast({
        title: 'Renouvellement automatique mis à jour',
        description: `Le renouvellement automatique a été ${subscription.autoRenew ? 'désactivé' : 'activé'}.`,
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onClientContacted() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscription.id}`, {
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

      toast({
        title: 'Contact client',
        description: 'Le client a été marqué comme contacté.',
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onRenewSubscription() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscription.id}/renew`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors du renouvellement')
      }

      toast({
        title: 'Abonnement renouvelé',
        description: 'L\'abonnement a été renouvelé avec succès.',
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors du renouvellement.',
      })
    } finally {
      setIsLoading(false)
      setShowRenewDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {subscription.status !== 'ACTIVE' && (
            <DropdownMenuItem
              onClick={() => onStatusChange('ACTIVE')}
              disabled={isLoading}
            >
              Activer
            </DropdownMenuItem>
          )}
          {subscription.status === 'CONTACT_NEEDED' && (
            <DropdownMenuItem
              onClick={onClientContacted}
              disabled={isLoading}
            >
              Marquer client contacté
            </DropdownMenuItem>
          )}
          {subscription.status !== 'PENDING' && (
            <DropdownMenuItem
              onClick={() => onStatusChange('PENDING')}
              disabled={isLoading}
            >
              Mettre en attente
            </DropdownMenuItem>
          )}
          {subscription.status !== 'EXPIRED' && (
            <DropdownMenuItem
              onClick={() => onStatusChange('EXPIRED')}
              disabled={isLoading}
            >
              Marquer comme expiré
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onAutoRenewToggle}
            disabled={isLoading}
          >
            {subscription.autoRenew ? 'Désactiver' : 'Activer'} le renouvellement
          </DropdownMenuItem>
          {subscription.status === 'EXPIRED' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowRenewDialog(true)}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Renouveler l'abonnement
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'abonnement sera supprimé définitivement
              et les profils seront libérés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renouveler cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va créer un nouvel abonnement en utilisant les mêmes paramètres 
              (offre, comptes, profils) que l'abonnement actuel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRenewSubscription}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renouveler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 
 
 
 