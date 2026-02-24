'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Subscription {
  id: string
  startDate: Date
  endDate: Date
  status: string
  autoRenew: boolean
  user: {
    firstName: string | null
    lastName: string | null
    email: string
  }
  offer: {
    name: string
    price: number
    duration: number
  }
  platformOffer?: {
    platform: {
      name: string
      logo: string | null
    }
  }
  subscriptionAccounts: {
    account: {
      username: string | null
      email: string | null
    }
  }[]
}

export const columns: ColumnDef<Subscription>[] = [
  {
    accessorKey: 'user',
    header: 'Client',
    cell: ({ row }) => {
      const user = row.original.user
      return (
        <div>
          <div className="font-medium">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'offer',
    header: 'Offre',
    cell: ({ row }) => {
      const offer = row.original.offer
      const platform = row.original.platformOffer?.platform
      return (
        <div className="flex items-center gap-2">
          {platform?.logo && (
            <img
              src={platform.logo}
              alt={platform.name}
              className="w-6 h-6 rounded"
            />
          )}
          <div>
            <div className="font-medium">{offer.name}</div>
            <div className="text-sm text-muted-foreground">
              {platform?.name}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Début',
    cell: ({ row }) => format(new Date(row.original.startDate), 'dd/MM/yyyy', { locale: fr }),
  },
  {
    accessorKey: 'endDate',
    header: 'Fin',
    cell: ({ row }) => format(new Date(row.original.endDate), 'dd/MM/yyyy', { locale: fr }),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={
          status === 'ACTIVE' ? 'success' :
          status === 'PENDING' ? 'warning' :
          status === 'EXPIRED' ? 'destructive' :
          status === 'CONTACT_NEEDED' ? 'outline' :
          'secondary'
        }>
          {status === 'ACTIVE' ? 'Actif' :
           status === 'PENDING' ? 'En attente' :
           status === 'EXPIRED' ? 'Expiré' :
           status === 'CONTACT_NEEDED' ? 'Client à rappeler' :
           status}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link href={`/admin/streaming/subscriptions/${row.original.id}`}>
            Détails
          </Link>
        </Button>
      )
    },
  },
] 
 
 
 