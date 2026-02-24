'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Copy, Calendar, Globe, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDate, formatPrice } from '@/lib/utils'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
  platform: {
    name: string
    logo: string | null
  }
  usedBy: {
    email: string
  } | null
  usedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function GiftCardDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchGiftCardDetails()
  }, [id])

  const fetchGiftCardDetails = async () => {
    try {
      const response = await fetch(`/api/admin/streaming/gift-cards/${id}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails de la carte')
      const data = await response.json()
      setGiftCard(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des détails de la carte')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/streaming/gift-cards/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      toast.success('Carte cadeau supprimée avec succès')
      router.push('/admin/streaming/gift-cards')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression de la carte')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge>Actif</Badge>
      case 'USED':
        return <Badge variant="secondary">Utilisé</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expiré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading || !giftCard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/streaming/gift-cards">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Chargement...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/streaming/gift-cards">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              Carte Cadeau
              {getStatusBadge(giftCard.status)}
            </h1>
            <p className="text-muted-foreground">
              Code: {giftCard.code}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(giftCard.code);
                  toast.success('Code copié dans le presse-papier');
                }}
                className="ml-2 h-6"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteDialog(true)}
          disabled={giftCard.status === 'USED'}
        >
          Supprimer
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la carte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mr-4">
                {giftCard.platform.logo ? (
                  <Image
                    src={giftCard.platform.logo}
                    alt={giftCard.platform.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm">
                    {giftCard.platform.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">{giftCard.platform.name}</div>
                <Badge variant="outline">{formatPrice(giftCard.amount, 'TRY')}</Badge>
              </div>
            </div>
            
            <div className="grid gap-4">
              {giftCard.usedBy && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="font-medium">Utilisé par</span>
                  </div>
                  <span>{giftCard.usedBy.email}</span>
                </div>
              )}

              {giftCard.usedAt && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="font-medium">Date d'utilisation</span>
                  </div>
                  <span>{formatDate(giftCard.usedAt)}</span>
                </div>
              )}

              {giftCard.expiresAt && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="font-medium">Date d'expiration</span>
                  </div>
                  <Badge variant={new Date(giftCard.expiresAt) > new Date() ? "default" : "destructive"}>
                    {formatDate(giftCard.expiresAt)}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Date de création</span>
                </div>
                <span>{formatDate(giftCard.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette carte cadeau ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 